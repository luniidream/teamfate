import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/next", async (req: Request, res: Response) => {
  const events = await db.select().from(eventsTable).limit(1);
  if (events.length === 0) { res.status(404).json({ error: "No event" }); return; }
  res.json(events[0]);
});

router.put("/next", async (req: Request, res: Response) => {
  const { title, description, imageUrl, externalUrl, eventDate } = req.body;
  const existing = await db.select().from(eventsTable).limit(1);
  const prev = existing[0];

  if (prev) {
    const [event] = await db
      .update(eventsTable)
      .set({
        title: title !== undefined ? title : prev.title,
        description: description !== undefined ? description : prev.description,
        imageUrl:
          imageUrl !== undefined ? imageUrl || null : prev.imageUrl ?? null,
        externalUrl:
          externalUrl !== undefined ? externalUrl || null : prev.externalUrl ?? null,
        eventDate:
          eventDate !== undefined ? eventDate || null : prev.eventDate ?? null,
      })
      .where(eq(eventsTable.id, prev.id))
      .returning();
    res.json(event);
  } else {
    const [event] = await db.insert(eventsTable).values({
      title: title || "",
      description: description || "",
      imageUrl: imageUrl || null,
      externalUrl: externalUrl || null,
      eventDate: eventDate || null,
    }).returning();
    res.json(event);
  }
});

export default router;
