import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";
import { shinyTypesTable } from "./shiny-types";

export const shiniesTable = pgTable("shinies", {
  id: serial("id").primaryKey(),
  pokemonId: integer("pokemon_id").notNull(),
  pokemonName: text("pokemon_name").notNull(),
  pokemonSpriteUrl: text("pokemon_sprite_url").notNull(),
  memberId: integer("member_id").notNull().references(() => membersTable.id, { onDelete: "cascade" }),
  shinyTypeId: integer("shiny_type_id").references(() => shinyTypesTable.id, { onDelete: "set null" }),
  caughtAt: timestamp("caught_at").notNull().defaultNow(),
  catchMethod: text("catch_method"),
  encounterNumber: integer("encounter_number"),
  location: text("location"),
  notes: text("notes"),
  isAlpha: boolean("is_alpha").notNull().default(false),
  isSecret: boolean("is_secret").notNull().default(false),
});

export const insertShinySchema = createInsertSchema(shiniesTable).omit({ id: true });
export type InsertShiny = z.infer<typeof insertShinySchema>;
export type Shiny = typeof shiniesTable.$inferSelect;
