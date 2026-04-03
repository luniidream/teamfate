import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bountiesTable = pgTable("bounties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  month: text("month").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  points: integer("points"),
});

export const insertBountySchema = createInsertSchema(bountiesTable).omit({ id: true });
export type InsertBounty = z.infer<typeof insertBountySchema>;
export type Bounty = typeof bountiesTable.$inferSelect;
