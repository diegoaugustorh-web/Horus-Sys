import { Router } from "express";
import { db } from "@workspace/db";
import { apolices, sinistros, comissoes, oportunidades, clientes } from "@workspace/db";
import { eq, and, lte, gte } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [allApolices, allSinistros, allComissoes, allOportunidades, allClientes] = await Promise.all([
    db.select().from(apolices),
    db.select().from(sinistros),
    db.select().from(comissoes),
    db.select().from(oportunidades),
    db.select().from(clientes),
  ]);

  const premioTotal = allApolices
    .filter((a) => a.status === "Vigente")
    .reduce((sum, a) => sum + Number(a.premio), 0);

  const apolicesVigentes = allApolices.filter((a) => a.status === "Vigente").length;
  const aRenovar = allApolices.filter((a) => a.status === "A Renovar").length;
  const sinistrosAbertos = allSinistros.filter((s) => s.status === "Aberto" || s.status === "Em Análise").length;

  const comissoesAReceber = allComissoes
    .filter((c) => c.status === "A Receber")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const pipelineValor = allOportunidades
    .filter((o) => !["Ganho", "Perdido"].includes(o.estagio))
    .reduce((sum, o) => sum + Number(o.valorEstimado), 0);

  const ganhoMes = allOportunidades
    .filter((o) => o.estagio === "Ganho")
    .reduce((sum, o) => sum + Number(o.valorEstimado), 0);

  res.json({
    premioTotal,
    apolicesVigentes,
    aRenovar,
    sinistrosAbertos,
    comissoesAReceber,
    pipelineValor,
    ganhoMes,
    totalClientes: allClientes.length,
    totalApolices: allApolices.length,
    totalOportunidades: allOportunidades.length,
  });
});

router.get("/proximos-vencimentos", async (req, res) => {
  const rows = await db.select().from(apolices);
  const upcoming = rows
    .filter((a) => a.status === "A Renovar" || a.status === "Vigente")
    .sort((a, b) => {
      if (!a.fim) return 1;
      if (!b.fim) return -1;
      return new Date(a.fim).getTime() - new Date(b.fim).getTime();
    })
    .slice(0, 10);

  res.json(upcoming.map((a) => ({
    ...a,
    premio: Number(a.premio),
    comissaoPct: Number(a.comissaoPct),
    clienteNome: null,
    criadoEm: a.criadoEm.toISOString(),
  })));
});

router.get("/sinistros-recentes", async (req, res) => {
  const rows = await db.select().from(sinistros);
  const recent = rows
    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
    .slice(0, 5);

  res.json(recent.map((s) => ({
    ...s,
    apoliceNumero: null,
    clienteNome: null,
    apoliceRamo: null,
    valorEstimado: Number(s.valorEstimado),
    abertoEm: s.abertoEm.toISOString(),
    criadoEm: s.criadoEm.toISOString(),
  })));
});

export default router;
