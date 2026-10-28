import { Router } from "express";
import { db } from "@workspace/db";
import { apolices, sinistros, comissoes, oportunidades, clientes } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

function dateParts(date: Date, options: Intl.DateTimeFormatOptions) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: BUSINESS_TIME_ZONE,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

function todayDateKey(now = new Date()) {
  const parts = dateParts(now, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function monthKey(date: Date) {
  const parts = dateParts(date, { year: "numeric", month: "2-digit" });
  return `${parts.year}-${parts.month}`;
}

function validDateKey(value: string | null) {
  const key = value?.slice(0, 10);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = new Date(`${key}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === key
    ? key
    : null;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function upcomingPolicies<T extends { status: string; fim: string | null }>(
  rows: T[],
  today: string,
) {
  const lastDay = addDays(today, 30);
  return rows
    .filter((policy) => {
      if (policy.status !== "Vigente" && policy.status !== "A Renovar") return false;
      const endDate = validDateKey(policy.fim);
      return endDate !== null && endDate >= today && endDate <= lastDay;
    })
    .sort((a, b) => validDateKey(a.fim)!.localeCompare(validDateKey(b.fim)!));
}

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
  const activePolicies = policyRows.filter((policy) => {
    const startDate = validDateKey(policy.inicio);
    const endDate = validDateKey(policy.fim);
    return (
      policy.status === "Vigente" &&
      startDate !== null &&
      endDate !== null &&
      startDate <= today &&
      endDate >= today
    );
  });

  const premioTotal = activePolicies.reduce((sum, policy) => sum + Number(policy.premio), 0);
  const aRenovar = upcomingPolicies(policyRows, today).length;
  const premioVendidoMes = policyRows
    .filter((policy) => validDateKey(policy.inicio)?.slice(0, 7) === currentMonth)
    .reduce((sum, policy) => sum + Number(policy.premio), 0);
  const comissaoGeradaMes = allComissoes
    .filter((commission) => monthKey(commission.criadoEm) === currentMonth)
    .reduce((sum, commission) => sum + Number(commission.valor), 0);
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
    apolicesVigentes: activePolicies.length,
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
