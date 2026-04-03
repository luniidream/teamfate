import { Router } from "express";
import type { Request, Response } from "express";
import { AdminLoginBody } from "@workspace/api-zod";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teamfate2025";

router.post("/login", (req: Request, res: Response) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: "Invalid request" });
    return;
  }
  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, message: "Invalid password" });
    return;
  }
  res.cookie("admin_session", "authenticated", {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });
  res.json({ success: true, message: "Logged in" });
});

router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("admin_session");
  res.json({ success: true, message: "Logged out" });
});

router.get("/me", (req: Request, res: Response) => {
  const session = req.cookies?.admin_session;
  res.json({ authenticated: session === "authenticated" });
});

export default router;
