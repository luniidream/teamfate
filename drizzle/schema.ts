import {
  pgEnum,
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  boolean,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Core user table for Manus OAuth
 */
export const userRole = pgEnum("user_role", ["user", "admin"]);
export const memberRole = pgEnum("member_role", ["member", "staff", "admin"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: userRole("role").default("user").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    openIdUq: uniqueIndex("users_openId_uq").on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Guild members (separate from OAuth users)
 */
export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 64 }).notNull(),
    displayName: varchar("displayName", { length: 255 }).notNull(),
    avatarUrl: text("avatarUrl"),
    discordId: varchar("discordId", { length: 64 }),
    role: memberRole("role").default("member").notNull(),
    joinedAt: timestamp("joinedAt", { withTimezone: false }).defaultNow().notNull(),
    shinyCount: integer("shinyCount").default(0).notNull(),
    shinyPoints: integer("shinyPoints").default(0).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }),
    passwordSalt: varchar("passwordSalt", { length: 255 }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: index("username_idx").on(table.username),
    usernameUq: uniqueIndex("members_username_uq").on(table.username),
  })
);

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * Member session tokens
 */
export const memberSessions = pgTable(
  "member_sessions",
  {
    token: varchar("token", { length: 255 }).primaryKey(),
    memberId: integer("memberId").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: false }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    memberIdIdx: index("memberId_idx").on(table.memberId),
    expiresAtIdx: index("expiresAt_idx").on(table.expiresAt),
  })
);

export type MemberSession = typeof memberSessions.$inferSelect;
export type InsertMemberSession = typeof memberSessions.$inferInsert;

/**
 * Shiny types (standard, secret, shalpha, etc.)
 */
export const shinyTypes = pgTable(
  "shiny_types",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    emoji: varchar("emoji", { length: 10 }),
    iconUrl: text("iconUrl"),
    isEnabled: boolean("isEnabled").default(true).notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("code_idx").on(table.code),
    codeUq: uniqueIndex("shiny_types_code_uq").on(table.code),
  })
);

export type ShinyType = typeof shinyTypes.$inferSelect;
export type InsertShinyType = typeof shinyTypes.$inferInsert;

/**
 * Catch / hunt methods (egg, fossil, SOS, etc.) — icons managed in admin
 */
export const shinyMethods = pgTable(
  "shiny_methods",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    emoji: varchar("emoji", { length: 10 }),
    iconUrl: text("iconUrl"),
    isEnabled: boolean("isEnabled").default(true).notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("method_code_idx").on(table.code),
    codeUq: uniqueIndex("shiny_methods_code_uq").on(table.code),
  })
);

export type ShinyMethod = typeof shinyMethods.$inferSelect;
export type InsertShinyMethod = typeof shinyMethods.$inferInsert;

/**
 * Team dex research targets (species + optional type/method focus)
 */
export const dexResearchTargets = pgTable("dex_research_targets", {
  id: serial("id").primaryKey(),
  pokemonId: integer("pokemonId").notNull(),
  pokemonName: varchar("pokemonName", { length: 255 }),
  shinyTypeId: integer("shinyTypeId"),
  shinyMethodId: integer("shinyMethodId"),
  notes: text("notes"),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
});

export type DexResearchTarget = typeof dexResearchTargets.$inferSelect;
export type InsertDexResearchTarget = typeof dexResearchTargets.$inferInsert;

/**
 * Caught shinies
 */
export const shinies = pgTable(
  "shinies",
  {
    id: serial("id").primaryKey(),
    pokemonId: integer("pokemonId").notNull(),
    pokemonName: varchar("pokemonName", { length: 255 }).notNull(),
    pokemonSpriteUrl: text("pokemonSpriteUrl"),
    memberId: integer("memberId").notNull(),
    shinyTypeId: integer("shinyTypeId"),
    shinyMethodId: integer("shinyMethodId"),
    caughtAt: date("caughtAt"),
    catchMethod: varchar("catchMethod", { length: 255 }),
    encounterNumber: integer("encounterNumber"),
    location: varchar("location", { length: 255 }),
    notes: text("notes"),
    characterName: varchar("characterName", { length: 255 }),
    nickname: varchar("nickname", { length: 255 }),
    reactionUrl: text("reactionUrl"),
    ivs: varchar("ivs", { length: 255 }),
    nature: varchar("nature", { length: 64 }),
    ballUsed: varchar("ballUsed", { length: 255 }),
    shinyStatus: varchar("shinyStatus", { length: 64 }),
    shinyCharmUsed: boolean("shinyCharmUsed").default(false).notNull(),
    isAlpha: boolean("isAlpha").default(false).notNull(),
    isSecret: boolean("isSecret").default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    memberIdIdx: index("memberId_idx").on(table.memberId),
    pokemonIdIdx: index("pokemonId_idx").on(table.pokemonId),
    caughtAtIdx: index("caughtAt_idx").on(table.caughtAt),
  })
);

export type Shiny = typeof shinies.$inferSelect;
export type InsertShiny = typeof shinies.$inferInsert;

/**
 * Bounties
 */
export const bounties = pgTable(
  "bounties",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    imageUrl: text("imageUrl"),
    month: varchar("month", { length: 64 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    points: integer("points"),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  },
  (table) => ({
    monthIdx: index("month_idx").on(table.month),
  })
);

export type Bounty = typeof bounties.$inferSelect;
export type InsertBounty = typeof bounties.$inferInsert;

/**
 * Events
 */
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    externalUrl: text("externalUrl"),
    eventDate: timestamp("eventDate", { withTimezone: false }),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  }
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Site settings and CMS content
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: serial("id").primaryKey(),
    logoUrl: text("logoUrl"),
    navHomeLabel: varchar("navHomeLabel", { length: 255 }).default("Home").notNull(),
    navTeamInfoLabel: varchar("navTeamInfoLabel", { length: 255 }).default("Team Info").notNull(),
    navShowcaseLabel: varchar("navShowcaseLabel", { length: 255 }).default("Shiny Showcase").notNull(),
    navDexLabel: varchar("navDexLabel", { length: 255 }).default("Shiny Dex").notNull(),
    navRecruitmentLabel: varchar("navRecruitmentLabel", { length: 255 }).default("Recruitment").notNull(),
    teamInfoTitle: varchar("teamInfoTitle", { length: 255 }).default("Team Fate").notNull(),
    teamInfoDescription: text("teamInfoDescription"),
    teamInfoButtonLabel: varchar("teamInfoButtonLabel", { length: 255 }).default("Join Us").notNull(),
    recruitmentTitle: varchar("recruitmentTitle", { length: 255 }).default("Join Team Fate").notNull(),
    recruitmentRequirements: text("recruitmentRequirements"),
    recruitmentPerks: text("recruitmentPerks"),
    recruitmentDiscordLabel: varchar("recruitmentDiscordLabel", { length: 255 }).default("Join Discord").notNull(),
    recruitmentDiscordUrl: text("recruitmentDiscordUrl"),
    recruitmentOpen: boolean("recruitmentOpen").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow().notNull(),
  }
);

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;
