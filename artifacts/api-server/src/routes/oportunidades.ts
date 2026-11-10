import { Router } from "express";
import { db } from "@workspace/db";
import { oportunidades, usuarios } from "@workspace/db";
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

router.get("/", async (req, res) => {
  const corretorId = await getEffectiveCorretorId(req);

  let query = db.select().from(oportunidades);
  if (corretorId) {
    query = query.where(eq(oportunidades.corretorId, corretorId));
  }

  const rows = await query;
  res.json(rows.map((o) => ({
    ...o,
    valorEstimado: Number(o.valorEstimado),
    criadoEm: o.criadoEm.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth.userId;
  const data = { ...req.body, corretorId: userId ?? req.body.corretorId };
  const [o] = await db.insert(oportunidades).values(data).returning();
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
