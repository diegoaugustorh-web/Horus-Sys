import { Router } from "express";
import { db } from "@workspace/db";
import { apolices, sinistros, comissoes, oportunidades, clientes } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  activePolicies,
  monthKey,
  sumCommissionsCreatedInMonth,
  sumPoliciesStartedInMonth,
  todayDateKey,
  upcomingPolicies,
  upcomingPolicyCount,
} from "./dashboard-metrics";

const router = Router();

router.get("/summary", async (req, res) => {
  const [policyRows, allSinistros, allComissoes, allOportunidades, clientRows] = await Promise.all([
    db.select({
      status: apolices.status,
      inicio: apolices.inicio,
      fim: apolices.fim,
      premio: apolices.premio,
    }).from(apolices),
    db.select({ status: sinistros.status }).from(sinistros),
    db.select({
      valor: comissoes.valor,
      criadoEm: comissoes.criadoEm,
      status: comissoes.status,
    }).from(comissoes),
    db.select({ estagio: oportunidades.estagio, valorEstimado: oportunidades.valorEstimado }).from(oportunidades),
    db.select({ id: clientes.id }).from(clientes),
  ]);

  const now = new Date();
  const today = todayDateKey(now);
  const currentMonth = monthKey(now);
  const currentActivePolicies = activePolicies(policyRows, today);

  const premioTotal = currentActivePolicies.reduce((sum, policy) => sum + Number(policy.premio), 0);
  const aRenovar = upcomingPolicyCount(policyRows, today);
  const premioVendidoMes = sumPoliciesStartedInMonth(policyRows, currentMonth);
  const comissaoGeradaMes = sumCommissionsCreatedInMonth(allComissoes, currentMonth);
  const sinistrosAbertos = allSinistros.filter((s) => s.status === "Aberto" || s.status === "Em Análise").length;

  const comissoesAReceber = allComissoes
    .filter((c) => c.status === "A Receber")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const pipelineValor = allOportunidades
    .filter((o) => !["Ganho", "Perdido"].includes(o.estagio))
    .reduce((sum, o) => sum + Number(o.valorEstimado), 0);

  res.json({
    premioTotal,
    premioVendidoMes,
    comissaoGeradaMes,
    apolicesVigentes: currentActivePolicies.length,
    aRenovar,
    sinistrosAbertos,
    comissoesAReceber,
    pipelineValor,
    totalClientes: clientRows.length,
    totalApolices: policyRows.length,
    totalOportunidades: allOportunidades.length,
  });
});

router.get("/proximos-vencimentos", async (req, res) => {
  const today = todayDateKey();
  const rows = await db
    .select()
    .from(apolices)
    .leftJoin(clientes, eq(apolices.clienteId, clientes.id));
  const upcoming = upcomingPolicies(
    rows.map(({ apolices: policy, clientes: client }) => ({
      ...policy,
      clienteNome: client?.nome ?? null,
    })),
    today,
  ).slice(0, 10);

  res.json(upcoming.map((a) => ({
    ...a,
    premio: Number(a.premio),
    comissaoPct: Number(a.comissaoPct),
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
