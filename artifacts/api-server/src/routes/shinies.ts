import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { shiniesTable, membersTable, shinyTypesTable } from "@workspace/db";
import { eq, and, gte, lt, sql, ilike, or } from "drizzle-orm";

const router = Router();

function getWeekRange(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { start: monday, end: nextMonday };
}

router.get("/", async (req: Request, res: Response) => {
  const { timeRange, memberId, pokemonId, shinyTypeId, search, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const conditions = [];

  if (timeRange === "week") {
    const { start, end } = getWeekRange(0);
    conditions.push(gte(shiniesTable.caughtAt, start));
    conditions.push(lt(shiniesTable.caughtAt, end));
  } else if (timeRange === "lastWeek") {
    const { start, end } = getWeekRange(-1);
    conditions.push(gte(shiniesTable.caughtAt, start));
    conditions.push(lt(shiniesTable.caughtAt, end));
  }

  if (memberId) conditions.push(eq(shiniesTable.memberId, parseInt(memberId)));
  if (pokemonId) conditions.push(eq(shiniesTable.pokemonId, parseInt(pokemonId)));
  if (shinyTypeId) conditions.push(eq(shiniesTable.shinyTypeId, parseInt(shinyTypeId)));
  if (search) {
    conditions.push(or(
      ilike(shiniesTable.pokemonName, `%${search}%`),
      ilike(shiniesTable.location, `%${search}%`),
    ));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(shiniesTable)
    .where(whereClause);
  const total = Number(countResult?.count || 0);

  const rows = await db
    .select({
      shiny: shiniesTable,
      member: membersTable,
      shinyType: shinyTypesTable,
    })
    .from(shiniesTable)
    .leftJoin(membersTable, eq(shiniesTable.memberId, membersTable.id))
    .leftJoin(shinyTypesTable, eq(shiniesTable.shinyTypeId, shinyTypesTable.id))
    .where(whereClause)
    .orderBy(sql`${shiniesTable.caughtAt} DESC`)
    .limit(parseInt(limit))
    .offset(parseInt(offset));

  const shinies = rows.map(({ shiny, member, shinyType }) => ({
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
    shinyTypeCode: shinyType?.code || null,
    caughtAt: shiny.caughtAt.toISOString(),
    catchMethod: shiny.catchMethod,
    encounterNumber: shiny.encounterNumber,
    location: shiny.location,
    notes: shiny.notes,
    isAlpha: shiny.isAlpha,
    isSecret: shiny.isSecret,
  }));

  res.json({ shinies, total });
});

router.post("/", async (req: Request, res: Response) => {
  const { pokemonId, pokemonName, pokemonSpriteUrl, memberId, shinyTypeId, caughtAt, catchMethod, encounterNumber, location, notes, isAlpha, isSecret } = req.body;

  const [shiny] = await db.insert(shiniesTable).values({
    pokemonId: parseInt(pokemonId),
    pokemonName,
    pokemonSpriteUrl,
    memberId: parseInt(memberId),
    shinyTypeId: shinyTypeId ? parseInt(shinyTypeId) : null,
    caughtAt: caughtAt ? new Date(caughtAt) : new Date(),
    catchMethod: catchMethod || null,
    encounterNumber: encounterNumber ? parseInt(encounterNumber) : null,
    location: location || null,
    notes: notes || null,
    isAlpha: !!isAlpha,
    isSecret: !!isSecret,
  }).returning();

  // Update member shiny count
  await db.update(membersTable)
    .set({
      shinyCount: sql`${membersTable.shinyCount} + 1`,
      shinyPoints: sql`${membersTable.shinyPoints} + 1`,
    })
    .where(eq(membersTable.id, parseInt(memberId)));

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, shiny.memberId));
  const [shinyType] = shiny.shinyTypeId
    ? await db.select().from(shinyTypesTable).where(eq(shinyTypesTable.id, shiny.shinyTypeId))
    : [null];

  res.status(201).json({
    ...shiny,
    memberUsername: member?.username || "",
    memberDisplayName: member?.displayName || "",
    shinyTypeName: shinyType?.name || null,
    shinyTypeEmoji: shinyType?.emoji || null,
    shinyTypeIconUrl: shinyType?.iconUrl || null,
    shinyTypeCode: shinyType?.code || null,
    caughtAt: shiny.caughtAt.toISOString(),
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const [row] = await db
    .select({ shiny: shiniesTable, member: membersTable, shinyType: shinyTypesTable })
    .from(shiniesTable)
    .leftJoin(membersTable, eq(shiniesTable.memberId, membersTable.id))
    .leftJoin(shinyTypesTable, eq(shiniesTable.shinyTypeId, shinyTypesTable.id))
    .where(eq(shiniesTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    ...row.shiny,
    memberUsername: row.member?.username || "",
    memberDisplayName: row.member?.displayName || "",
    shinyTypeName: row.shinyType?.name || null,
    shinyTypeEmoji: row.shinyType?.emoji || null,
    shinyTypeIconUrl: row.shinyType?.iconUrl || null,
    shinyTypeCode: row.shinyType?.code || null,
    caughtAt: row.shiny.caughtAt.toISOString(),
  });
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const {
    pokemonId,
    pokemonName,
    pokemonSpriteUrl,
    memberId,
    shinyTypeId,
    caughtAt,
    catchMethod,
    encounterNumber,
    location,
    notes,
    isAlpha,
    isSecret,
  } = req.body;

  const pid = parseInt(String(pokemonId), 10);
  const defaultGif = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pid}.gif`;

  const [shiny] = await db.update(shiniesTable).set({
    pokemonId: pid,
    pokemonName,
    pokemonSpriteUrl: pokemonSpriteUrl || defaultGif,
    memberId: parseInt(String(memberId), 10),
    shinyTypeId: shinyTypeId ? parseInt(String(shinyTypeId), 10) : null,
    caughtAt: caughtAt ? new Date(caughtAt) : new Date(),
    catchMethod: catchMethod || null,
    encounterNumber: encounterNumber ? parseInt(String(encounterNumber), 10) : null,
    location: location || null,
    notes: notes || null,
    isAlpha: !!isAlpha,
    isSecret: !!isSecret,
  }).where(eq(shiniesTable.id, id)).returning();

  if (!shiny) { res.status(404).json({ error: "Not found" }); return; }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, shiny.memberId));
  const [shinyType] = shiny.shinyTypeId
    ? await db.select().from(shinyTypesTable).where(eq(shinyTypesTable.id, shiny.shinyTypeId))
    : [null];

  res.json({
    ...shiny,
    memberUsername: member?.username || "",
    memberDisplayName: member?.displayName || "",
    shinyTypeName: shinyType?.name || null,
    shinyTypeEmoji: shinyType?.emoji || null,
    shinyTypeIconUrl: shinyType?.iconUrl || null,
    shinyTypeCode: shinyType?.code || null,
    caughtAt: shiny.caughtAt.toISOString(),
  });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const [shiny] = await db.select().from(shiniesTable).where(eq(shiniesTable.id, id));
  if (shiny) {
    await db.update(membersTable)
      .set({
        shinyCount: sql`GREATEST(${membersTable.shinyCount} - 1, 0)`,
        shinyPoints: sql`GREATEST(${membersTable.shinyPoints} - 1, 0)`,
      })
      .where(eq(membersTable.id, shiny.memberId));
    await db.delete(shiniesTable).where(eq(shiniesTable.id, id));
  }
  res.status(204).send();
});

export default router;
