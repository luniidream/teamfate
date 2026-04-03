import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shinyTypesTable = pgTable("shiny_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  emoji: text("emoji"),
  iconUrl: text("icon_url"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertShinyTypeSchema = createInsertSchema(shinyTypesTable).omit({ id: true });
export type InsertShinyType = z.infer<typeof insertShinyTypeSchema>;
export type ShinyType = typeof shinyTypesTable.$inferSelect;
