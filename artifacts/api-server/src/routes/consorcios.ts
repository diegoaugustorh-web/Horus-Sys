import { Router } from "express";
import { db } from "@workspace/db";
import { consorcios, clientes } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichConsorcio(c: typeof consorcios.$inferSelect) {
  let clienteNome: string | null = null;
  if (c.clienteId) {
    const [cl] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, c.clienteId));
    clienteNome = cl?.nome ?? null;
  }
  return {
    ...c,
    clienteNome,
    valorCredito: Number(c.valorCredito),
    taxaAdmPct: Number(c.taxaAdmPct),
    parcela: Number(c.parcela),
    criadoEm: c.criadoEm.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const rows = await db.select().from(consorcios);
  res.json(await Promise.all(rows.map(enrichConsorcio)));
});

router.post("/", async (req, res) => {
  const [c] = await db.insert(consorcios).values(req.body).returning();
  res.status(201).json(await enrichConsorcio(c));
});

router.patch("/:id", async (req, res) => {
  const [c] = await db.update(consorcios).set(req.body).where(eq(consorcios.id, req.params.id)).returning();
  if (!c) { res.status(404).json({ error: "Consórcio não encontrado" }); return; }
  return res.json(await enrichConsorcio(c));
});

router.delete("/:id", async (req, res) => {
  await db.delete(consorcios).where(eq(consorcios.id, req.params.id));
  res.status(204).send();
});

export default router;
