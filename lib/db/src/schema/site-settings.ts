import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  navHomeLabel: text("nav_home_label").notNull().default("Home"),
  navTeamInfoLabel: text("nav_team_info_label").notNull().default("Team Info"),
  navShowcaseLabel: text("nav_showcase_label").notNull().default("Shiny Showcase"),
  navShinyDexLabel: text("nav_shiny_dex_label").notNull().default("Shiny Dex"),
  navRecruitmentLabel: text("nav_recruitment_label").notNull().default("Recruitment"),
  teamInfoTitle: text("team_info_title").notNull().default("Team Fate"),
  teamInfoDescription: text("team_info_description")
    .notNull()
    .default("Welcome to Team Fate, a shiny hunting community."),
  teamInfoButtonLabel: text("team_info_button_label").notNull().default("Go to Recruitment"),
  recruitmentTitle: text("recruitment_title").notNull().default("Recruitment"),
  recruitmentRequirements: text("recruitment_requirements")
    .notNull()
    .default("Add your recruitment requirements from Admin."),
  recruitmentDiscordButtonLabel: text("recruitment_discord_button_label")
    .notNull()
    .default("Team Fate Discord Server"),
  recruitmentDiscordUrl: text("recruitment_discord_url")
    .notNull()
    .default("https://discord.gg/your-server"),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
