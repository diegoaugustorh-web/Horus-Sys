import { Router } from "express";
import { db } from "@workspace/db";
import { apolices, clientes } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router = Router();

function toNum(v: unknown) {
  return v ? Number(v) : 0;
}

async function enrichApolice(a: typeof apolices.$inferSelect) {
  let clienteNome: string | null = null;
  if (a.clienteId) {
    const [c] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, a.clienteId));
    clienteNome = c?.nome ?? null;
  }
  return {
    ...a,
    clienteNome,
    premio: toNum(a.premio),
    comissaoPct: toNum(a.comissaoPct),
    criadoEm: a.criadoEm.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { q, ramo, status, clienteId } = req.query as Record<string, string | undefined>;
  let rows = await db.select().from(apolices);
  if (ramo) rows = rows.filter((a) => a.ramo === ramo);
  if (status) rows = rows.filter((a) => a.status === status);
  if (clienteId) rows = rows.filter((a) => a.clienteId === clienteId);
  if (q) rows = rows.filter((a) => a.numero.toLowerCase().includes(q.toLowerCase()) || (a.seguradora ?? "").toLowerCase().includes(q.toLowerCase()));
  res.json(await Promise.all(rows.map(enrichApolice)));
});

router.post("/", async (req, res) => {
  const [a] = await db.insert(apolices).values(req.body).returning();
  res.status(201).json(await enrichApolice(a));
});

router.patch("/:id", async (req, res) => {
  const [a] = await db.update(apolices).set(req.body).where(eq(apolices.id, req.params.id)).returning();
  if (!a) { res.status(404).json({ error: "Apólice não encontrada" }); return; }
  return res.json(await enrichApolice(a));
});

router.delete("/:id", async (req, res) => {
  await db.delete(apolices).where(eq(apolices.id, req.params.id));
  res.status(204).send();
});

export default router;
