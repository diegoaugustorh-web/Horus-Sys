import { Router } from "express";
import { db } from "@workspace/db";
import { comissoes, apolices, clientes, usuarios } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function getEffectiveCorretorId(req: any): Promise<string | null> {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) return null;

  const [user] = await db.select({ role: usuarios.role }).from(usuarios).where(eq(usuarios.id, userId)).limit(1);
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (req.query.corretorId as string) || null;
  }
  return userId;
}

async function enrichComissao(c: typeof comissoes.$inferSelect) {
  let apoliceNumero: string | null = null;
  let clienteNome: string | null = null;
  let seguradora: string | null = null;
  if (c.apoliceId) {
    const [a] = await db.select().from(apolices).where(eq(apolices.id, c.apoliceId));
    if (a) {
      apoliceNumero = a.numero;
      seguradora = a.seguradora;
      if (a.clienteId) {
        const [cl] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, a.clienteId));
        clienteNome = cl?.nome ?? null;
      }
    }
  }
  return {
    ...c,
    apoliceNumero,
    clienteNome,
    seguradora,
    valor: Number(c.valor),
    criadoEm: c.criadoEm.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const { status } = req.query as { status?: string };
  const corretorId = await getEffectiveCorretorId(req);

  let query = db.select().from(comissoes);
  if (corretorId) {
    query = query.where(eq(comissoes.corretorId, corretorId));
  }

  let rows = await query;
  if (status) rows = rows.filter((c) => c.status === status);
  res.json(await Promise.all(rows.map(enrichComissao)));
});

router.post("/", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth.userId;
  const data = { ...req.body, corretorId: userId ?? req.body.corretorId };
  const [c] = await db.insert(comissoes).values(data).returning();
  res.status(201).json(await enrichComissao(c));
});

router.patch("/:id", async (req, res) => {
  const [c] = await db.update(comissoes).set(req.body).where(eq(comissoes.id, req.params.id)).returning();
  if (!c) { res.status(404).json({ error: "Comissão não encontrada" }); return; }
  return res.json(await enrichComissao(c));
});

export default router;
