import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getMemberSession } from "../db";
import { parse as parseCookies } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminToken?: string;
  memberId?: number;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminToken: string | undefined;
  let memberId: number | undefined;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const cookiesHeader = opts.req.headers.cookie || "";
  const parsedCookies = parseCookies(cookiesHeader);

  // Check for admin token
  const adminCookie = parsedCookies.admin_token;
  if (adminCookie) {
    adminToken = adminCookie;
  }

  // Check for member token
  const memberCookie = parsedCookies.member_token;
  if (memberCookie) {
    const session = await getMemberSession(memberCookie);
    if (session && session.expiresAt > new Date()) {
      memberId = session.memberId;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminToken,
    memberId,
  };
}
