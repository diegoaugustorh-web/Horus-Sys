import { Router } from "express";
import { db } from "@workspace/db";
import { sinistros, apolices, clientes } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichSinistro(s: typeof sinistros.$inferSelect) {
  let apoliceNumero: string | null = null;
  let clienteNome: string | null = null;
  let apoliceRamo: string | null = null;
  if (s.apoliceId) {
    const [a] = await db.select().from(apolices).where(eq(apolices.id, s.apoliceId));
    if (a) {
      apoliceNumero = a.numero;
      apoliceRamo = a.ramo;
      if (a.clienteId) {
        const [c] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, a.clienteId));
        clienteNome = c?.nome ?? null;
      }
    }
  }
  return {
    ...s,
    apoliceNumero,
    clienteNome,
    apoliceRamo,
    valorEstimado: Number(s.valorEstimado),
    abertoEm: s.abertoEm.toISOString(),
    criadoEm: s.criadoEm.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { status } = req.query as { status?: string };
  let rows = await db.select().from(sinistros);
  if (status) rows = rows.filter((s) => s.status === status);
  res.json(await Promise.all(rows.map(enrichSinistro)));
});

router.post("/", async (req, res) => {
  const [s] = await db.insert(sinistros).values(req.body).returning();
  res.status(201).json(await enrichSinistro(s));
});

router.patch("/:id", async (req, res) => {
  const [s] = await db.update(sinistros).set(req.body).where(eq(sinistros.id, req.params.id)).returning();
  if (!s) { res.status(404).json({ error: "Sinistro não encontrado" }); return; }
  return res.json(await enrichSinistro(s));
});

router.delete("/:id", async (req, res) => {
  await db.delete(sinistros).where(eq(sinistros.id, req.params.id));
  res.status(204).send();
});

export default router;
