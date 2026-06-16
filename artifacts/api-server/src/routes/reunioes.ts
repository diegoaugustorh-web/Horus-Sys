import { Router } from "express";
import { db } from "@workspace/db";
import { reunioes, clientes } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function enrichReuniao(r: typeof reunioes.$inferSelect) {
  let clienteNome: string | null = null;
  let clienteTelefone: string | null = null;
  let clienteEmail: string | null = null;
  if (r.clienteId) {
    const [c] = await db.select({ nome: clientes.nome, telefone: clientes.telefone, email: clientes.email }).from(clientes).where(eq(clientes.id, r.clienteId));
    clienteNome = c?.nome ?? null;
    clienteTelefone = c?.telefone ?? null;
    clienteEmail = c?.email ?? null;
  }
  return {
    ...r,
    clienteNome,
    clienteTelefone,
    clienteEmail,
    criadoEm: r.criadoEm.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const rows = await db.select().from(reunioes);
  res.json(await Promise.all(rows.map(enrichReuniao)));
});

router.post("/", async (req, res) => {
  const [r] = await db.insert(reunioes).values(req.body).returning();
  res.status(201).json(await enrichReuniao(r));
});

router.delete("/:id", async (req, res) => {
  await db.delete(reunioes).where(eq(reunioes.id, req.params.id));
  res.status(204).send();
});

export default router;
