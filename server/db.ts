import { eq, desc, asc, and, inArray, isNull, lte, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  members,
  memberSessions,
  shinies,
  shinyTypes,
  shinyMethods,
  dexResearchTargets,
  bounties,
  events,
  siteSettings,
  type Member,
  type Shiny,
  type ShinyType,
  type ShinyMethod,
  type DexResearchTarget,
  type Bounty,
  type Event,
  type SiteSettings,
  type MemberSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_pool) {
        const connectionString = process.env.DATABASE_URL;
        const needsSsl = /sslmode=require/i.test(connectionString) || /supabase\.com/i.test(connectionString);
        _pool = new Pool({
          connectionString,
          ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
        });
      }
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ MEMBERS ============

export async function getAllMembers(): Promise<Member[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).orderBy(desc(members.shinyPoints), asc(members.displayName));
}

export async function getMemberById(id: number): Promise<Member | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function getMemberByUsername(username: string): Promise<Member | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.username, username)).limit(1);
  return result[0];
}

export async function createMember(data: {
  username: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  role?: string;
}): Promise<Member> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .insert(members)
    .values({
      username: data.username,
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      role: (data.role as any) || "member",
    } as any)
    .returning({ id: members.id });
  const id = row?.id;
  if (!id) throw new Error("Failed to create member");
  const member = await getMemberById(id);
  if (!member) throw new Error("Failed to create member");
  return member;
}

export async function updateMember(id: number, data: Partial<Member>): Promise<Member> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(members).set(data).where(eq(members.id, id));

  const member = await getMemberById(id);
  if (!member) throw new Error("Member not found after update");
  return member;
}

export async function deleteMember(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated shinies first
  await db.delete(shinies).where(eq(shinies.memberId, id));
  // Delete sessions
  await db.delete(memberSessions).where(eq(memberSessions.memberId, id));
  // Delete member
  await db.delete(members).where(eq(members.id, id));
}

export async function incrementShinyCount(memberId: number, points: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const member = await getMemberById(memberId);
  if (!member) return;

  await db
    .update(members)
    .set({
      shinyCount: member.shinyCount + 1,
      shinyPoints: member.shinyPoints + points,
    })
    .where(eq(members.id, memberId));
}

export async function decrementShinyCount(memberId: number, points: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const member = await getMemberById(memberId);
  if (!member) return;

  await db
    .update(members)
    .set({
      shinyCount: Math.max(0, member.shinyCount - 1),
      shinyPoints: Math.max(0, member.shinyPoints - points),
    })
    .where(eq(members.id, memberId));
}

// ============ MEMBER SESSIONS ============

export async function createMemberSession(
  memberId: number,
  token: string,
  expiresAt: Date
): Promise<MemberSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(memberSessions).values({
    token,
    memberId,
    expiresAt,
  });

  return { token, memberId, expiresAt, createdAt: new Date() };
}

export async function getMemberSession(token: string): Promise<MemberSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(memberSessions)
    .where(eq(memberSessions.token, token))
    .limit(1);

  return result[0];
}

export async function deleteMemberSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(memberSessions).where(eq(memberSessions.token, token));
}

export async function cleanupExpiredSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(memberSessions).where(lte(memberSessions.expiresAt, new Date()));
}

// ============ SHINIES ============

export type ShinyListRow = Shiny & {
  memberDisplayName: string;
  shinyTypeName: string | null;
  shinyTypeIconUrl: string | null;
  shinyMethodName: string | null;
  shinyMethodIconUrl: string | null;
};

export async function getAllShinies(): Promise<ShinyListRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      shiny: shinies,
      memberDisplayName: members.displayName,
      shinyTypeName: shinyTypes.name,
      shinyTypeIconUrl: shinyTypes.iconUrl,
      shinyMethodName: shinyMethods.name,
      shinyMethodIconUrl: shinyMethods.iconUrl,
    })
    .from(shinies)
    .leftJoin(members, eq(shinies.memberId, members.id))
    .leftJoin(shinyTypes, eq(shinies.shinyTypeId, shinyTypes.id))
    .leftJoin(shinyMethods, eq(shinies.shinyMethodId, shinyMethods.id))
    .orderBy(desc(shinies.createdAt));

  return rows.map((r) => ({
    ...r.shiny,
    memberDisplayName: r.memberDisplayName ?? "Unknown",
    shinyTypeName: r.shinyTypeName,
    shinyTypeIconUrl: r.shinyTypeIconUrl,
    shinyMethodName: r.shinyMethodName,
    shinyMethodIconUrl: r.shinyMethodIconUrl,
  }));
}

export async function getShinyById(id: number): Promise<Shiny | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shinies).where(eq(shinies.id, id)).limit(1);
  return result[0];
}

export async function getShinyByMemberId(memberId: number): Promise<Shiny[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shinies).where(eq(shinies.memberId, memberId)).orderBy(desc(shinies.createdAt));
}

export async function getShiniesByMemberIdWithDetails(memberId: number): Promise<ShinyListRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      shiny: shinies,
      memberDisplayName: members.displayName,
      shinyTypeName: shinyTypes.name,
      shinyTypeIconUrl: shinyTypes.iconUrl,
      shinyMethodName: shinyMethods.name,
      shinyMethodIconUrl: shinyMethods.iconUrl,
    })
    .from(shinies)
    .leftJoin(members, eq(shinies.memberId, members.id))
    .leftJoin(shinyTypes, eq(shinies.shinyTypeId, shinyTypes.id))
    .leftJoin(shinyMethods, eq(shinies.shinyMethodId, shinyMethods.id))
    .where(eq(shinies.memberId, memberId))
    .orderBy(desc(shinies.createdAt));

  return rows.map((r) => ({
    ...r.shiny,
    memberDisplayName: r.memberDisplayName ?? "Unknown",
    shinyTypeName: r.shinyTypeName,
    shinyTypeIconUrl: r.shinyTypeIconUrl,
    shinyMethodName: r.shinyMethodName,
    shinyMethodIconUrl: r.shinyMethodIconUrl,
  }));
}

export async function getRecentShinies(days: number = 7): Promise<Shiny[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db
    .select()
    .from(shinies)
    .where(gt(shinies.createdAt, startDate))
    .orderBy(desc(shinies.createdAt));
}

export async function createShiny(data: Omit<Shiny, "id" | "createdAt" | "updatedAt">): Promise<Shiny> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(shinies).values(data as any).returning({ id: shinies.id });
  const id = row?.id;
  if (!id) throw new Error("Failed to create shiny");

  // Increment member's shiny count
  await incrementShinyCount(data.memberId, 1);

  const shiny = await getShinyById(id);
  if (!shiny) throw new Error("Failed to create shiny");
  return shiny;
}

export async function updateShiny(id: number, data: Partial<Shiny>): Promise<Shiny> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(shinies).set(data).where(eq(shinies.id, id));

  const shiny = await getShinyById(id);
  if (!shiny) throw new Error("Shiny not found after update");
  return shiny;
}

export async function deleteShiny(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shiny = await getShinyById(id);
  if (shiny) {
    await decrementShinyCount(shiny.memberId, 1);
  }

  await db.delete(shinies).where(eq(shinies.id, id));
}

// ============ SHINY TYPES ============

export async function getAllShinyTypes(): Promise<ShinyType[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shinyTypes).orderBy(asc(shinyTypes.sortOrder), asc(shinyTypes.name));
}

export async function getShinyTypeById(id: number): Promise<ShinyType | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shinyTypes).where(eq(shinyTypes.id, id)).limit(1);
  return result[0];
}

export async function createShinyType(data: Omit<ShinyType, "id" | "createdAt" | "updatedAt">): Promise<ShinyType> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(shinyTypes).values(data as any).returning({ id: shinyTypes.id });
  const id = row?.id;
  if (!id) throw new Error("Failed to create shiny type");

  const shinyType = await getShinyTypeById(id);
  if (!shinyType) throw new Error("Failed to create shiny type");
  return shinyType;
}

export async function updateShinyType(id: number, data: Partial<ShinyType>): Promise<ShinyType> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(shinyTypes).set(data).where(eq(shinyTypes.id, id));

  const shinyType = await getShinyTypeById(id);
  if (!shinyType) throw new Error("Shiny type not found after update");
  return shinyType;
}

export async function deleteShinyType(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(shinyTypes).where(eq(shinyTypes.id, id));
}

// ============ SHINY METHODS ============

export async function getAllShinyMethods(): Promise<ShinyMethod[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shinyMethods).orderBy(asc(shinyMethods.sortOrder), asc(shinyMethods.name));
}

export async function getShinyMethodById(id: number): Promise<ShinyMethod | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shinyMethods).where(eq(shinyMethods.id, id)).limit(1);
  return result[0];
}

export async function createShinyMethod(
  data: Omit<ShinyMethod, "id" | "createdAt" | "updatedAt">
): Promise<ShinyMethod> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rowId] = await db.insert(shinyMethods).values(data as any).returning({ id: shinyMethods.id });
  const id = rowId?.id;
  if (!id) throw new Error("Failed to create shiny method");
  const row = await getShinyMethodById(id);
  if (!row) throw new Error("Failed to create shiny method");
  return row;
}

export async function updateShinyMethod(id: number, data: Partial<ShinyMethod>): Promise<ShinyMethod> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shinyMethods).set(data).where(eq(shinyMethods.id, id));
  const row = await getShinyMethodById(id);
  if (!row) throw new Error("Shiny method not found after update");
  return row;
}

export async function deleteShinyMethod(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shinies).set({ shinyMethodId: null }).where(eq(shinies.shinyMethodId, id));
  await db.update(dexResearchTargets).set({ shinyMethodId: null }).where(eq(dexResearchTargets.shinyMethodId, id));
  await db.delete(shinyMethods).where(eq(shinyMethods.id, id));
}

// ============ DEX RESEARCH TARGETS ============

export type DexResearchRow = DexResearchTarget & {
  shinyTypeName: string | null;
  shinyMethodName: string | null;
};

export async function getAllDexResearchTargets(): Promise<DexResearchRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      target: dexResearchTargets,
      shinyTypeName: shinyTypes.name,
      shinyMethodName: shinyMethods.name,
    })
    .from(dexResearchTargets)
    .leftJoin(shinyTypes, eq(dexResearchTargets.shinyTypeId, shinyTypes.id))
    .leftJoin(shinyMethods, eq(dexResearchTargets.shinyMethodId, shinyMethods.id))
    .orderBy(asc(dexResearchTargets.sortOrder), asc(dexResearchTargets.pokemonId));

  return rows.map((r) => ({
    ...r.target,
    shinyTypeName: r.shinyTypeName,
    shinyMethodName: r.shinyMethodName,
  }));
}

export async function createDexResearchTarget(
  data: Omit<DexResearchTarget, "id" | "createdAt" | "updatedAt">
): Promise<DexResearchTarget> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(dexResearchTargets).values(data as any).returning();
  if (!row) throw new Error("Failed to create dex research target");
  return row;
}

export async function updateDexResearchTarget(
  id: number,
  data: Partial<DexResearchTarget>
): Promise<DexResearchTarget> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dexResearchTargets).set(data).where(eq(dexResearchTargets.id, id));
  const row = await db.select().from(dexResearchTargets).where(eq(dexResearchTargets.id, id)).limit(1);
  if (!row[0]) throw new Error("Dex research target not found after update");
  return row[0];
}

export async function deleteDexResearchTarget(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dexResearchTargets).where(eq(dexResearchTargets.id, id));
}

// ============ BOUNTIES ============

export async function getAllBounties(): Promise<Bounty[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bounties).orderBy(desc(bounties.createdAt));
}

export async function getActiveBounties(): Promise<Bounty[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bounties).where(eq(bounties.isActive, true)).orderBy(desc(bounties.createdAt));
}

export async function getBountyById(id: number): Promise<Bounty | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
  return result[0];
}

export async function createBounty(data: Omit<Bounty, "id" | "createdAt" | "updatedAt">): Promise<Bounty> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(bounties).values(data as any).returning({ id: bounties.id });
  const id = row?.id;
  if (!id) throw new Error("Failed to create bounty");

  const bounty = await getBountyById(id);
  if (!bounty) throw new Error("Failed to create bounty");
  return bounty;
}

export async function updateBounty(id: number, data: Partial<Bounty>): Promise<Bounty> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bounties).set(data).where(eq(bounties.id, id));

  const bounty = await getBountyById(id);
  if (!bounty) throw new Error("Bounty not found after update");
  return bounty;
}

export async function deleteBounty(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bounties).where(eq(bounties.id, id));
}

// ============ EVENTS ============

export async function getNextEvent(): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).orderBy(desc(events.createdAt)).limit(1);
  return result[0];
}

export async function getAllEvents(): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.eventDate), desc(events.createdAt));
}

export async function createEvent(data: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db.insert(events).values(data as any).returning({ id: events.id });
  const id = row?.id;
  if (!id) throw new Error("Failed to create event");

  const event = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event[0]) throw new Error("Failed to create event");
  return event[0];
}

export async function updateEvent(id: number, data: Partial<Event>): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(events).set(data).where(eq(events.id, id));

  const event = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event[0]) throw new Error("Event not found after update");
  return event[0];
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
}

// ============ SITE SETTINGS ============

export async function getSiteSettings(): Promise<SiteSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).limit(1);
  return result[0];
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSiteSettings();

  if (existing) {
    await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing.id));
    const updated = await getSiteSettings();
    if (!updated) throw new Error("Failed to update site settings");
    return updated;
  } else {
    const [row] = await db.insert(siteSettings).values(data as any).returning({ id: siteSettings.id });
    const id = row?.id;
    if (!id) throw new Error("Failed to create site settings");
    const settings = await db.select().from(siteSettings).where(eq(siteSettings.id, id)).limit(1);
    if (!settings[0]) throw new Error("Failed to create site settings");
    return settings[0];
  }
}

// ============ STATS ============

export async function getStats() {
  const db = await getDb();
  if (!db) return { memberCount: 0, totalShinies: 0, shinyPoints: 0, recentCatches: [] };

  const [mc] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(members);
  const [sc] = await db.select({ n: sql<number>`cast(count(*) as int)` }).from(shinies);
  const [pt] = await db.select({ s: sql<number>`cast(coalesce(sum(${members.shinyPoints}), 0) as int)` }).from(members);
  const recentCatches = await getRecentShinies(7);

  return {
    memberCount: Number(mc?.n ?? 0),
    totalShinies: Number(sc?.n ?? 0),
    shinyPoints: Number(pt?.s ?? 0),
    recentCatches,
  };
}
