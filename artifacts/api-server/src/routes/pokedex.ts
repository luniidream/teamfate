import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { shiniesTable, membersTable, shinyTypesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// Pre-defined basic pokedex data for first 151 Pokemon
const GENERATIONS: Record<number, { gen: number; region: string }> = {};
const genRanges = [
  { gen: 1, region: "Kanto", start: 1, end: 151 },
  { gen: 2, region: "Johto", start: 152, end: 251 },
  { gen: 3, region: "Hoenn", start: 252, end: 386 },
  { gen: 4, region: "Sinnoh", start: 387, end: 493 },
  { gen: 5, region: "Unova", start: 494, end: 649 },
  { gen: 6, region: "Kalos", start: 650, end: 721 },
  { gen: 7, region: "Alola", start: 722, end: 809 },
  { gen: 8, region: "Galar", start: 810, end: 905 },
  { gen: 9, region: "Paldea", start: 906, end: 1025 },
];

for (const { gen, region, start, end } of genRanges) {
  for (let i = start; i <= end; i++) {
    GENERATIONS[i] = { gen, region };
  }
}

router.get("/", async (req: Request, res: Response) => {
  const { region, search, memberId, alphaOnly, secretOnly } = req.query as Record<string, string>;

  // Fetch all shiny catches with member and type info
  const shinyRows = await db
    .select({
      shiny: shiniesTable,
      member: membersTable,
      shinyType: shinyTypesTable,
    })
    .from(shiniesTable)
    .leftJoin(membersTable, eq(shiniesTable.memberId, membersTable.id))
    .leftJoin(shinyTypesTable, eq(shiniesTable.shinyTypeId, shinyTypesTable.id))
    .orderBy(sql`${shiniesTable.caughtAt} DESC`);

  // Group by pokemonId
  const pokemonMap = new Map<number, {
    pokemonId: number;
    name: string;
    spriteUrl: string;
    catches: typeof shinyRows;
  }>();

  for (const row of shinyRows) {
    const pid = row.shiny.pokemonId;
    if (!pokemonMap.has(pid)) {
      pokemonMap.set(pid, {
        pokemonId: pid,
        name: row.shiny.pokemonName,
        spriteUrl: row.shiny.pokemonSpriteUrl,
        catches: [],
      });
    }
    pokemonMap.get(pid)!.catches.push(row);
  }

  let entries = Array.from(pokemonMap.values()).map(({ pokemonId, name, spriteUrl, catches }) => {
    const genInfo = GENERATIONS[pokemonId] || { gen: 1, region: "Unknown" };

    let filteredCatches = catches;
    if (memberId) filteredCatches = catches.filter(c => c.shiny.memberId === parseInt(memberId));
    if (alphaOnly === "true") filteredCatches = catches.filter(c => c.shiny.isAlpha);
    if (secretOnly === "true") filteredCatches = catches.filter(c => c.shiny.isSecret);

    const ownedBy = filteredCatches.map(({ shiny, member, shinyType }) => ({
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

    const ownershipStatus = ownedBy.length === 0 ? "missing" : "owned";
    return {
      pokemonId,
      name,
      spriteUrl,
      types: [],
      generation: genInfo.gen,
      region: genInfo.region,
      ownedBy,
      ownershipStatus: ownershipStatus as "owned" | "partial" | "missing",
      evolutionLineStatus: ownershipStatus as "complete" | "partial" | "missing",
    };
  });

  // Filter by region
  if (region && region !== "all") {
    entries = entries.filter(e => e.region.toLowerCase() === region.toLowerCase());
  }
  // Filter by search
  if (search) {
    const s = search.toLowerCase();
    entries = entries.filter(e => e.name.toLowerCase().includes(s));
  }

  const totalOwned = entries.filter(e => e.ownershipStatus === "owned").length;
  const completionPercent = entries.length > 0 ? (totalOwned / entries.length) * 100 : 0;

  res.json({
    entries: entries.sort((a, b) => a.pokemonId - b.pokemonId),
    totalOwned,
    totalPokemon: entries.length,
    completionPercent: Math.round(completionPercent * 10) / 10,
  });
});

export default router;
