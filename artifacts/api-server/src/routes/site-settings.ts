import { Router } from "express";
import type { Request, Response } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SETTINGS = {
  navHomeLabel: "Home",
  navTeamInfoLabel: "Team Info",
  navShowcaseLabel: "Shiny Showcase",
  navShinyDexLabel: "Shiny Dex",
  navRecruitmentLabel: "Recruitment",
  teamInfoTitle: "Team Fate",
  teamInfoDescription: "Welcome to Team Fate, a shiny hunting community.",
  teamInfoButtonLabel: "Go to Recruitment",
  recruitmentTitle: "Recruitment",
  recruitmentRequirements: "Add your recruitment requirements from Admin.",
  recruitmentDiscordButtonLabel: "Team Fate Discord Server",
  recruitmentDiscordUrl: "https://discord.gg/your-server",
};

function isAdmin(req: Request) {
  return req.cookies?.admin_session === "authenticated";
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (rows.length === 0) {
      res.json(DEFAULT_SETTINGS);
      return;
    }
    res.json(rows[0]);
  } catch {
    // If DB table is not pushed yet, return defaults so public pages still work.
    res.json(DEFAULT_SETTINGS);
  }
});

router.put("/", async (req: Request, res: Response) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = {
    navHomeLabel: String(req.body?.navHomeLabel ?? DEFAULT_SETTINGS.navHomeLabel),
    navTeamInfoLabel: String(req.body?.navTeamInfoLabel ?? DEFAULT_SETTINGS.navTeamInfoLabel),
    navShowcaseLabel: String(req.body?.navShowcaseLabel ?? DEFAULT_SETTINGS.navShowcaseLabel),
    navShinyDexLabel: String(req.body?.navShinyDexLabel ?? DEFAULT_SETTINGS.navShinyDexLabel),
    navRecruitmentLabel: String(req.body?.navRecruitmentLabel ?? DEFAULT_SETTINGS.navRecruitmentLabel),
    teamInfoTitle: String(req.body?.teamInfoTitle ?? DEFAULT_SETTINGS.teamInfoTitle),
    teamInfoDescription: String(
      req.body?.teamInfoDescription ?? DEFAULT_SETTINGS.teamInfoDescription,
    ),
    teamInfoButtonLabel: String(
      req.body?.teamInfoButtonLabel ?? DEFAULT_SETTINGS.teamInfoButtonLabel,
    ),
    recruitmentTitle: String(req.body?.recruitmentTitle ?? DEFAULT_SETTINGS.recruitmentTitle),
    recruitmentRequirements: String(
      req.body?.recruitmentRequirements ?? DEFAULT_SETTINGS.recruitmentRequirements,
    ),
    recruitmentDiscordButtonLabel: String(
      req.body?.recruitmentDiscordButtonLabel ??
        DEFAULT_SETTINGS.recruitmentDiscordButtonLabel,
    ),
    recruitmentDiscordUrl: String(
      req.body?.recruitmentDiscordUrl ?? DEFAULT_SETTINGS.recruitmentDiscordUrl,
    ),
  };

  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (rows.length > 0) {
      const [updated] = await db
        .update(siteSettingsTable)
        .set(payload)
        .where(eq(siteSettingsTable.id, rows[0].id))
        .returning();
      res.json(updated);
      return;
    }

    const [created] = await db.insert(siteSettingsTable).values(payload).returning();
    res.json(created);
  } catch (error) {
    res.status(500).json({
      error:
        "Failed to save site settings. If this is a fresh setup, run db push for new tables.",
      details: String(error),
    });
  }
});

export default router;
