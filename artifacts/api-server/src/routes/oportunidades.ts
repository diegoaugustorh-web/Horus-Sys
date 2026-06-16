import { Router } from "express";
import { db } from "@workspace/db";
import { oportunidades } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await db.select().from(oportunidades);
  res.json(rows.map((o) => ({
    ...o,
    valorEstimado: Number(o.valorEstimado),
    criadoEm: o.criadoEm.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const [o] = await db.insert(oportunidades).values(req.body).returning();
  res.status(201).json({
    ...o,
    valorEstimado: Number(o.valorEstimado),
    criadoEm: o.criadoEm.toISOString(),
  });
});

router.patch("/:id", async (req, res) => {
  const [o] = await db.update(oportunidades).set(req.body).where(eq(oportunidades.id, req.params.id)).returning();
  if (!o) { res.status(404).json({ error: "Oportunidade não encontrada" }); return; }
  return res.json({
    ...o,
    valorEstimado: Number(o.valorEstimado),
    criadoEm: o.criadoEm.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  await db.delete(oportunidades).where(eq(oportunidades.id, req.params.id));
  res.status(204).send();
});

export default router;
