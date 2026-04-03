import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const members = await db.select().from(membersTable).orderBy(membersTable.shinyPoints);
  res.json(members.reverse());
});

router.post("/", async (req: Request, res: Response) => {
  const { username, displayName, avatarUrl, role } = req.body;
  if (!username || !displayName || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [member] = await db.insert(membersTable).values({
    username,
    displayName,
    avatarUrl: avatarUrl || null,
    role,
  }).returning();
  res.status(201).json(member);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { username, displayName, avatarUrl, role } = req.body;
  const [member] = await db.update(membersTable)
    .set({ username, displayName, avatarUrl: avatarUrl || null, role })
    .where(eq(membersTable.id, id))
    .returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(member);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(membersTable).where(eq(membersTable.id, id));
  res.status(204).send();
});

export default router;
