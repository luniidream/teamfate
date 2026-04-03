import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  discordId: text("discord_id"),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  shinyCount: integer("shiny_count").notNull().default(0),
  shinyPoints: integer("shiny_points").notNull().default(0),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, shinyCount: true, shinyPoints: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
