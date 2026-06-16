import { Router } from "express";
import { db } from "@workspace/db";
import { clientes } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { q, tipo } = req.query as { q?: string; tipo?: string };
  let query = db.select().from(clientes);
  const conditions = [];
  if (tipo) conditions.push(eq(clientes.tipo, tipo));
  if (q) {
    conditions.push(
      or(
        ilike(clientes.nome, `%${q}%`),
        ilike(clientes.email, `%${q}%`),
        ilike(clientes.cpfCnpj, `%${q}%`),
      )!,
    );
  }
  const rows = conditions.length
    ? await db.select().from(clientes).where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => or(a, b)!))
    : await query;
  const result = rows.map((c) => ({
    ...c,
    produtoValorContratado: c.produtoValorContratado ? Number(c.produtoValorContratado) : null,
    produtoValorParcela: c.produtoValorParcela ? Number(c.produtoValorParcela) : null,
    produtoValorTotalParcelas: c.produtoValorTotalParcelas ? Number(c.produtoValorTotalParcelas) : null,
    produtoValorComissao: c.produtoValorComissao ? Number(c.produtoValorComissao) : null,
    criadoEm: c.criadoEm.toISOString(),
  }));
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const [c] = await db.select().from(clientes).where(eq(clientes.id, req.params.id));
  if (!c) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  return res.json({
    ...c,
    produtoValorContratado: c.produtoValorContratado ? Number(c.produtoValorContratado) : null,
    produtoValorParcela: c.produtoValorParcela ? Number(c.produtoValorParcela) : null,
    produtoValorTotalParcelas: c.produtoValorTotalParcelas ? Number(c.produtoValorTotalParcelas) : null,
    produtoValorComissao: c.produtoValorComissao ? Number(c.produtoValorComissao) : null,
    criadoEm: c.criadoEm.toISOString(),
  });
});

router.post("/", async (req, res) => {
  const [c] = await db.insert(clientes).values(req.body).returning();
  res.status(201).json({
    ...c,
    criadoEm: c.criadoEm.toISOString(),
  });
});

router.patch("/:id", async (req, res) => {
  const [c] = await db.update(clientes).set(req.body).where(eq(clientes.id, req.params.id)).returning();
  if (!c) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  return res.json({
    ...c,
    criadoEm: c.criadoEm.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  await db.delete(clientes).where(eq(clientes.id, req.params.id));
  res.status(204).send();
});

export default router;
