import { Router } from "express";
import { db } from "@workspace/db";
import { usuarios } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Não autorizado" });
  req.userId = userId;
  next();
}

async function ensureUser(userId: string, email: string | null) {
  const [existing] = await db.select().from(usuarios).where(eq(usuarios.id, userId));
  if (!existing) {
    const allUsers = await db.select().from(usuarios);
    const role = allUsers.length === 0 ? "admin" : "corretor";
    const [u] = await db.insert(usuarios).values({
      id: userId,
      email: email ?? userId,
      role,
    }).returning();
    return u;
  }
  return existing;
}

router.get("/me", requireAuth, async (req: any, res) => {
  const auth = getAuth(req);
  const email = auth?.sessionClaims?.email as string | null ?? null;
  const u = await ensureUser(req.userId, email);
  res.json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(usuarios);
  res.json(rows.map((u) => ({ ...u, criadoEm: u.criadoEm.toISOString() })));
});

router.post("/", requireAuth, async (req, res) => {
  const { email, nome, role, password: _p, ...rest } = req.body;
  const [u] = await db.insert(usuarios).values({ id: crypto.randomUUID(), email, nome, role }).returning();
  res.status(201).json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { password: _p, ...data } = req.body;
  const [u] = await db.update(usuarios).set(data).where(eq(usuarios.id, req.params.id)).returning();
  if (!u) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  return res.json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.delete("/:id", requireAuth, async (req, res) => {
  await db.delete(usuarios).where(eq(usuarios.id, req.params.id));
  res.status(204).send();
});

export default router;
