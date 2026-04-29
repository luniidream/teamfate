import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  getAllMembers,
  getMemberById,
  getMemberByUsername,
  createMember,
  updateMember,
  deleteMember,
  getAllShinies,
  getShinyById,
  getShinyByMemberId,
  getShiniesByMemberIdWithDetails,
  getRecentShinies,
  createShiny,
  updateShiny,
  deleteShiny,
  getAllShinyTypes,
  getShinyTypeById,
  createShinyType,
  updateShinyType,
  deleteShinyType,
  getAllShinyMethods,
  getShinyMethodById,
  createShinyMethod,
  updateShinyMethod,
  deleteShinyMethod,
  getAllDexResearchTargets,
  createDexResearchTarget,
  updateDexResearchTarget,
  deleteDexResearchTarget,
  getAllBounties,
  getActiveBounties,
  getBountyById,
  createBounty,
  updateBounty,
  deleteBounty,
  getNextEvent,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getSiteSettings,
  updateSiteSettings,
  getStats,
  createMemberSession,
  getMemberSession,
  deleteMemberSession,
  cleanupExpiredSessions,
} from "./db";
import {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  generateSessionToken,
  verifyAdminPassword,
} from "./auth";
// ============ ADMIN PROCEDURES ============

const adminProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.adminToken) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated as admin" });
  }
  return next({ ctx: { ...ctx, adminToken: ctx.adminToken } });
});

// ============ MEMBER PROCEDURES ============

const memberProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.memberId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated as member" });
  }
  return next({ ctx: { ...ctx, memberId: ctx.memberId } });
});

export const appRouter = router({
  system: systemRouter,

  // ============ AUTH ============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ ADMIN AUTH ============
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!verifyAdminPassword(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
        }

        const token = generateSessionToken();
        const cookieOptions = getSessionCookieOptions(ctx.req);

        ctx.res.cookie("admin_token", token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return { success: true, token };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_token", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    me: publicProcedure.query(({ ctx }) => {
      return ctx.adminToken ? { authenticated: true } : null;
    }),
  }),

  // ============ MEMBER AUTH ============
  memberAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const member = await getMemberByUsername(input.username);
        if (!member || !member.passwordHash || !member.passwordSalt) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        if (!verifyPassword(input.password, member.passwordHash, member.passwordSalt)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }

        const token = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await createMemberSession(member.id, token, expiresAt);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("member_token", token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return { success: true, token, member };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("member_token", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.memberId) return null;
      return getMemberById(ctx.memberId);
    }),
  }),

  // ============ MEMBERS (ADMIN) ============
  members: router({
    list: publicProcedure.query(getAllMembers),

    getById: publicProcedure.input(z.number()).query(({ input }) => getMemberById(input)),

    create: adminProcedure
      .input(
        z.object({
          username: z.string().min(3),
          displayName: z.string().min(1),
          role: z.enum(["member", "staff", "admin"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getMemberByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Username already exists" });
        }

        const password = generateRandomPassword();
        const { hash, salt } = hashPassword(password);

        const member = await createMember({
          username: input.username,
          displayName: input.displayName,
          passwordHash: hash,
          passwordSalt: salt,
          role: input.role,
        });

        return { member, generatedPassword: password };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          displayName: z.string().optional(),
          avatarUrl: z.string().optional(),
          discordId: z.string().optional(),
          role: z.enum(["member", "staff", "admin"]).optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateMember(id, data);
      }),

    resetPassword: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const password = generateRandomPassword();
        const { hash, salt } = hashPassword(password);

        await updateMember(input.id, {
          passwordHash: hash,
          passwordSalt: salt,
        });

        return { generatedPassword: password };
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteMember(input)),

    deleteAll: adminProcedure.mutation(async () => {
      const allMembers = await getAllMembers();
      for (const member of allMembers) {
        await deleteMember(member.id);
      }
      return { deleted: allMembers.length };
    }),
  }),

  // ============ SHINIES ============
  shinies: router({
    list: publicProcedure.query(getAllShinies),

    getById: publicProcedure.input(z.number()).query(({ input }) => getShinyById(input)),

    /** @deprecated Use getMine when logged in as member; admin uses list or this with admin cookie */
    getByMemberId: adminProcedure.input(z.number()).query(({ input }) => getShinyByMemberId(input)),

    getMine: memberProcedure.query(({ ctx }) => getShiniesByMemberIdWithDetails(ctx.memberId)),

    getRecent: publicProcedure
      .input(z.object({ days: z.number().optional() }).optional())
      .query(({ input }) => getRecentShinies(input?.days)),

    create: memberProcedure
      .input(
        z.object({
          pokemonId: z.number(),
          pokemonName: z.string(),
          pokemonSpriteUrl: z.string().optional(),
          shinyTypeId: z.number().optional().nullable(),
          shinyMethodId: z.number().optional().nullable(),
          caughtAt: z.string().optional(),
          catchMethod: z.string().optional(),
          encounterNumber: z.number().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
          characterName: z.string().optional(),
          nickname: z.string().optional(),
          reactionUrl: z.string().optional(),
          ivs: z.string().optional(),
          nature: z.string().optional(),
          ballUsed: z.string().optional(),
          shinyStatus: z.string().optional(),
          shinyCharmUsed: z.boolean().optional(),
          isAlpha: z.boolean().optional(),
          isSecret: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createShiny({
          ...input,
          memberId: ctx.memberId,
          caughtAt: input.caughtAt ? new Date(input.caughtAt) : undefined,
        } as any);
      }),

    createAsAdmin: adminProcedure
      .input(
        z.object({
          memberId: z.number(),
          pokemonId: z.number(),
          pokemonName: z.string(),
          pokemonSpriteUrl: z.string().optional(),
          shinyTypeId: z.number().optional().nullable(),
          shinyMethodId: z.number().optional().nullable(),
          caughtAt: z.string().optional(),
          catchMethod: z.string().optional(),
          encounterNumber: z.number().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
          characterName: z.string().optional(),
          nickname: z.string().optional(),
          reactionUrl: z.string().optional(),
          ivs: z.string().optional(),
          nature: z.string().optional(),
          ballUsed: z.string().optional(),
          shinyStatus: z.string().optional(),
          shinyCharmUsed: z.boolean().optional(),
          isAlpha: z.boolean().optional(),
          isSecret: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { memberId, ...rest } = input;
        return createShiny({
          ...rest,
          memberId,
          caughtAt: input.caughtAt ? new Date(input.caughtAt) : undefined,
        } as any);
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            pokemonId: z.number().optional(),
            pokemonName: z.string().optional(),
            pokemonSpriteUrl: z.string().optional().nullable(),
            nickname: z.string().optional().nullable(),
            location: z.string().optional().nullable(),
            notes: z.string().optional().nullable(),
            shinyTypeId: z.number().optional().nullable(),
            shinyMethodId: z.number().optional().nullable(),
            catchMethod: z.string().optional().nullable(),
            caughtAt: z.string().optional().nullable(),
            encounterNumber: z.number().optional().nullable(),
            isAlpha: z.boolean().optional(),
            isSecret: z.boolean().optional(),
            shinyCharmUsed: z.boolean().optional(),
            nature: z.string().optional().nullable(),
            ballUsed: z.string().optional().nullable(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const shiny = await getShinyById(input.id);
        if (!shiny) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Shiny not found" });
        }

        if (!ctx.adminToken && ctx.memberId !== shiny.memberId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot update other member's shinies" });
        }

        const { caughtAt, ...rest } = input.data;
        const patch: Record<string, unknown> = { ...rest };
        if (caughtAt !== undefined) {
          patch.caughtAt = caughtAt ? new Date(caughtAt) : null;
        }

        return updateShiny(input.id, patch as any);
      }),

    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const shiny = await getShinyById(input);
        if (!shiny) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Shiny not found" });
        }

        if (!ctx.adminToken && ctx.memberId !== shiny.memberId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete other member's shinies" });
        }

        await deleteShiny(input);
        return { success: true };
      }),
  }),

  // ============ SHINY TYPES ============
  shinyTypes: router({
    list: publicProcedure.query(getAllShinyTypes),

    getById: publicProcedure.input(z.number()).query(({ input }) => getShinyTypeById(input)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          code: z.string(),
          emoji: z.string().optional(),
          iconUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => createShinyType(input as any)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          emoji: z.string().optional(),
          iconUrl: z.string().optional(),
          isEnabled: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateShinyType(id, data);
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteShinyType(input)),
  }),

  // ============ SHINY METHODS ============
  shinyMethods: router({
    list: publicProcedure.query(getAllShinyMethods),

    getById: publicProcedure.input(z.number()).query(({ input }) => getShinyMethodById(input)),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          code: z.string(),
          emoji: z.string().optional(),
          iconUrl: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => createShinyMethod(input as any)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          emoji: z.string().optional(),
          iconUrl: z.string().optional(),
          isEnabled: z.boolean().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateShinyMethod(id, data);
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteShinyMethod(input)),
  }),

  // ============ DEX RESEARCH ============
  dexResearch: router({
    list: publicProcedure.query(getAllDexResearchTargets),

    create: adminProcedure
      .input(
        z.object({
          pokemonId: z.number(),
          pokemonName: z.string().optional(),
          shinyTypeId: z.number().optional().nullable(),
          shinyMethodId: z.number().optional().nullable(),
          notes: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => createDexResearchTarget(input as any)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          pokemonId: z.number().optional(),
          pokemonName: z.string().optional().nullable(),
          shinyTypeId: z.number().optional().nullable(),
          shinyMethodId: z.number().optional().nullable(),
          notes: z.string().optional().nullable(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateDexResearchTarget(id, data);
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteDexResearchTarget(input)),
  }),

  // ============ BOUNTIES ============
  bounties: router({
    list: publicProcedure.query(getAllBounties),

    getActive: publicProcedure.query(getActiveBounties),

    getById: publicProcedure.input(z.number()).query(({ input }) => getBountyById(input)),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          month: z.string(),
          points: z.number().optional(),
        })
      )
      .mutation(({ input }) => createBounty(input as any)),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          month: z.string().optional(),
          isActive: z.boolean().optional(),
          points: z.number().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateBounty(id, data);
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteBounty(input)),
  }),

  // ============ EVENTS ============
  events: router({
    getNext: publicProcedure.query(getNextEvent),

    list: adminProcedure.query(getAllEvents),

    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          externalUrl: z.string().optional(),
          eventDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createEvent({
          ...input,
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
        } as any);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          externalUrl: z.string().optional(),
          eventDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateEvent(id, {
          ...data,
          eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        } as any);
      }),

    delete: adminProcedure.input(z.number()).mutation(({ input }) => deleteEvent(input)),
  }),

  // ============ SITE SETTINGS ============
  siteSettings: router({
    get: publicProcedure.query(getSiteSettings),

    update: adminProcedure
      .input(
        z.object({
          logoUrl: z.string().optional(),
          navHomeLabel: z.string().optional(),
          navTeamInfoLabel: z.string().optional(),
          navShowcaseLabel: z.string().optional(),
          navDexLabel: z.string().optional(),
          navRecruitmentLabel: z.string().optional(),
          teamInfoTitle: z.string().optional(),
          teamInfoDescription: z.string().optional(),
          teamInfoButtonLabel: z.string().optional(),
          recruitmentTitle: z.string().optional(),
          recruitmentRequirements: z.string().optional(),
          recruitmentPerks: z.string().optional().nullable(),
          recruitmentDiscordLabel: z.string().optional(),
          recruitmentDiscordUrl: z.string().optional(),
          recruitmentOpen: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => updateSiteSettings(input as any)),
  }),

  // ============ STATS ============
  stats: router({
    get: publicProcedure.query(getStats),
  }),
});

export type AppRouter = typeof appRouter;
