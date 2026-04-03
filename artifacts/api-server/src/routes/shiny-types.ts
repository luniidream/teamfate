import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { shinyTypesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const types = await db.select().from(shinyTypesTable).orderBy(shinyTypesTable.sortOrder);
  res.json(types);
});

router.post("/", async (req: Request, res: Response) => {
  const { name, code, emoji, iconUrl, isEnabled, sortOrder } = req.body;
  const [type] = await db.insert(shinyTypesTable).values({
    name,
    code,
    emoji: emoji || null,
    iconUrl: iconUrl || null,
    isEnabled: isEnabled !== false,
    sortOrder: sortOrder || 0,
  }).returning();
  res.status(201).json(type);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const { name, code, emoji, iconUrl, isEnabled, sortOrder } = req.body;
  const [type] = await db.update(shinyTypesTable)
    .set({ name, code, emoji: emoji || null, iconUrl: iconUrl || null, isEnabled: !!isEnabled, sortOrder })
    .where(eq(shinyTypesTable.id, id))
    .returning();
  if (!type) { res.status(404).json({ error: "Not found" }); return; }
  res.json(type);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  await db.delete(shinyTypesTable).where(eq(shinyTypesTable.id, id));
  res.status(204).send();
});

export default router;
