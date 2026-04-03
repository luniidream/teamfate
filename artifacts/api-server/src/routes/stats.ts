import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { membersTable, shiniesTable, shinyTypesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(membersTable);
  const [shinyCount] = await db.select({ count: sql<number>`count(*)` }).from(shiniesTable);
  const [pointsSum] = await db.select({ sum: sql<number>`coalesce(sum(shiny_points), 0)` }).from(membersTable);

  const recentRows = await db
    .select({
      shiny: shiniesTable,
      member: membersTable,
      shinyType: shinyTypesTable,
    })
    .from(shiniesTable)
    .leftJoin(membersTable, eq(shiniesTable.memberId, membersTable.id))
    .leftJoin(shinyTypesTable, eq(shiniesTable.shinyTypeId, shinyTypesTable.id))
    .orderBy(sql`${shiniesTable.caughtAt} DESC`)
    .limit(10);

  const recentCatches = recentRows.map(({ shiny, member, shinyType }) => ({
    id: shiny.id,
    pokemonId: shiny.pokemonId,
    pokemonName: shiny.pokemonName,
    pokemonSpriteUrl: shiny.pokemonSpriteUrl,
    memberId: shiny.memberId,
    memberUsername: member?.username || "",
    memberDisplayName: member?.displayName || "",
    shinyTypeId: shiny.shinyTypeId,
    shinyTypeName: shinyType?.name || null,
    shinyTypeEmoji: shinyType?.emoji || null,
    shinyTypeIconUrl: shinyType?.iconUrl || null,
    caughtAt: shiny.caughtAt.toISOString(),
    catchMethod: shiny.catchMethod,
    encounterNumber: shiny.encounterNumber,
    location: shiny.location,
    notes: shiny.notes,
    isAlpha: shiny.isAlpha,
    isSecret: shiny.isSecret,
  }));

  res.json({
    memberCount: Number(memberCount?.count || 0),
    totalShinies: Number(shinyCount?.count || 0),
    shinyPoints: Number(pointsSum?.sum || 0),
    recentCatches,
  });
});

export default router;
