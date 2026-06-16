import { Router } from "express";
import { db } from "@workspace/db";
import { produtos } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { categoria, tipoPessoa } = req.query as { categoria?: string; tipoPessoa?: string };
  let rows = await db.select().from(produtos);
  if (categoria) rows = rows.filter((p) => p.categoria === categoria);
  if (tipoPessoa) rows = rows.filter((p) => p.tipoPessoa === tipoPessoa);
  res.json(rows.map((p) => ({ ...p, criadoEm: p.criadoEm.toISOString() })));
});

router.post("/", async (req, res) => {
  const [p] = await db.insert(produtos).values(req.body).returning();
  res.status(201).json({ ...p, criadoEm: p.criadoEm.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const [p] = await db.update(produtos).set(req.body).where(eq(produtos.id, req.params.id)).returning();
  if (!p) { res.status(404).json({ error: "Produto não encontrado" }); return; }
  return res.json({ ...p, criadoEm: p.criadoEm.toISOString() });
});

router.delete("/:id", async (req, res) => {
  await db.delete(produtos).where(eq(produtos.id, req.params.id));
  res.status(204).send();
});

export default router;
