import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { bountiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { month } = req.query as Record<string, string>;
  const query = db.select().from(bountiesTable);
  const bounties = month
    ? await db.select().from(bountiesTable).where(eq(bountiesTable.month, month))
    : await db.select().from(bountiesTable);
  res.json(bounties);
});

router.post("/", async (req: Request, res: Response) => {
  const { title, description, imageUrl, month, isActive, points } = req.body;
  const [bounty] = await db.insert(bountiesTable).values({
    title,
    description,
    imageUrl: imageUrl || null,
    month,
    isActive: isActive !== false,
    points: points ? parseInt(points) : null,
  }).returning();
  res.status(201).json(bounty);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, description, imageUrl, month, isActive, points } = req.body;
  const [bounty] = await db.update(bountiesTable)
    .set({ title, description, imageUrl: imageUrl || null, month, isActive: !!isActive, points: points ? parseInt(points) : null })
    .where(eq(bountiesTable.id, id))
    .returning();
  if (!bounty) { res.status(404).json({ error: "Not found" }); return; }
  res.json(bounty);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(bountiesTable).where(eq(bountiesTable.id, id));
  res.status(204).send();
});

export default router;
