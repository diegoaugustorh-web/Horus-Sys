import { Router } from "express";
import { db } from "@workspace/db";
import { usuarios } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const router = Router();

const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }
  next();
};

const requireAdmin: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  const [user] = await db
    .select({ role: usuarios.role })
    .from(usuarios)
    .where(eq(usuarios.id, userId))
    .limit(1);

  if (user?.role !== "admin") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  next();
};

async function ensureUser(userId: string, email: string | null) {
  return db.transaction(async (tx) => {
    // Serialize initial account creation so concurrent first logins cannot both become admins.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(194672331, 1)`);

    const [existing] = await tx.select().from(usuarios).where(eq(usuarios.id, userId));
    if (existing) return existing;

    const [firstUser] = await tx.select({ id: usuarios.id }).from(usuarios).limit(1);
    const role = firstUser ? "corretor" : "admin";
    const [user] = await tx.insert(usuarios).values({
      id: userId,
      email: email ?? userId,
      role,
    }).returning();
    return user;
  });
}

router.get("/me", requireAuth, async (req: any, res) => {
  const auth = getAuth(req);
  const email = auth?.sessionClaims?.email as string | null ?? null;
  const u = await ensureUser(req.userId, email);
  res.json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.get("/", requireAdmin, async (req, res) => {
  const rows = await db.select().from(usuarios);
  res.json(rows.map((u) => ({ ...u, criadoEm: u.criadoEm.toISOString() })));
});

router.post("/", requireAdmin, async (req, res) => {
  const { email, nome, role, password: _p, ...rest } = req.body;
  const [u] = await db.insert(usuarios).values({ id: crypto.randomUUID(), email, nome, role }).returning();
  res.status(201).json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { password: _p, ...data } = req.body;
  const [u] = await db.update(usuarios).set(data).where(eq(usuarios.id, id)).returning();
  if (!u) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  return res.json({ ...u, criadoEm: u.criadoEm.toISOString() });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(usuarios).where(eq(usuarios.id, id));
  res.status(204).send();
});

export default router;
