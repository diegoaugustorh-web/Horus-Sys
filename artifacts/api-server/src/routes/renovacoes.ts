import { Router } from "express";
import { db } from "@workspace/db";
import { apolices, clientes, renovacoesRegua, usuarios } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { todayDateKey, validDateKey } from "./dashboard-metrics";

const router = Router();

const REGRAS = [90, 60, 30, 15, 7] as const;

function daysUntil(dateKey: string | null, today: string): number | null {
  const end = validDateKey(dateKey);
  if (!end) return null;
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const todayDate = new Date(`${today}T00:00:00.000Z`);
  return Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
}

async function getEffectiveCorretorId(req: any): Promise<string | null> {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) return null;
  const [user] = await db.select({ role: usuarios.role }).from(usuarios).where(eq(usuarios.id, userId)).limit(1);
  const isAdmin = user?.role === "admin";
  if (isAdmin) return (req.query.corretorId as string) || null;
  return userId;
}

function gerarMensagem(dias: number, clienteNome: string, apoliceNumero: string, ramo: string): string {
  const nome = clienteNome || "Cliente";
  if (dias >= 60) return `Olá ${nome}! Sua apólice ${apoliceNumero} (${ramo}) vence em ${dias} dias. Posso já iniciar a renovação para você?`;
  if (dias >= 30) return `${nome}, faltam ${dias} dias para o vencimento da apólice ${apoliceNumero}. Quer que eu prepare as melhores opções?`;
  if (dias >= 15) return `Atenção ${nome}: sua apólice ${apoliceNumero} vence em ${dias} dias. Podemos renovar hoje?`;
  return `Urgente ${nome}! Sua apólice ${apoliceNumero} vence em ${dias} dias. Posso finalizar a renovação agora?`;
}

function calcularScoreRenovacao(days: number | null, temSinistroAberto: boolean): { score: number; risco: string } {
  if (days === null) return { score: 50, risco: "medio" };
  let score = 100;
  if (days <= 7) score -= 40;
  else if (days <= 15) score -= 25;
  else if (days <= 30) score -= 15;
  else if (days <= 60) score -= 8;
  if (temSinistroAberto) score -= 20;
  score = Math.max(0, Math.min(100, score));
  const risco = score >= 70 ? "baixo" : score >= 40 ? "medio" : "alto";
  return { score, risco };
}

router.get("/regua", async (req, res) => {
  const today = todayDateKey();
  const corretorId = await getEffectiveCorretorId(req);

  let query = db
    .select()
    .from(apolices)
    .leftJoin(clientes, eq(apolices.clienteId, clientes.id));

  if (corretorId) query = query.where(eq(apolices.corretorId, corretorId));

  const rows = await query;

  const itens = rows
    .map(({ apolices: a, clientes: c }) => {
      const days = daysUntil(a.fim, today);
      if (days === null || days < 0 || days > 95) return null;

      const regraProxima = REGRAS.find((r) => days <= r && days > (REGRAS[REGRAS.indexOf(r) + 1] ?? 0));
      if (!regraProxima) return null;

      const { score, risco } = calcularScoreRenovacao(days, false);

      return {
        apoliceId: a.id,
        numero: a.numero,
        ramo: a.ramo,
        fim: a.fim,
        clienteId: c?.id ?? null,
        clienteNome: c?.nome ?? null,
        clienteTelefone: c?.telefone ?? null,
        daysUntil: days,
        regra: regraProxima,
        mensagem: gerarMensagem(regraProxima, c?.nome ?? "", a.numero, a.ramo),
        scoreRenovacao: score,
        risco,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

  res.json(itens);
});

router.get("/cross-sell", async (req, res) => {
  const corretorId = await getEffectiveCorretorId(req);

  let query = db.select().from(apolices);
  if (corretorId) query = query.where(eq(apolices.corretorId, corretorId));

  const policies = await query;

  const sugestoes: any[] = [];
  const porCliente = new Map<string, string[]>();

  for (const p of policies) {
    if (!p.clienteId) continue;
    const ramos = porCliente.get(p.clienteId) ?? [];
    if (!ramos.includes(p.ramo)) ramos.push(p.ramo);
    porCliente.set(p.clienteId, ramos);
  }

  for (const [clienteId, ramos] of porCliente.entries()) {
    const [cliente] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, clienteId));
    if (ramos.includes("Auto") && !ramos.includes("Vida")) {
      sugestoes.push({ clienteId, clienteNome: cliente?.nome, sugestao: "Vida", motivo: "Cliente tem Auto e não tem Vida" });
    }
    if (ramos.includes("Auto") && !ramos.includes("Residencial")) {
      sugestoes.push({ clienteId, clienteNome: cliente?.nome, sugestao: "Residencial", motivo: "Cliente tem Auto e não tem Residencial" });
    }
    if (!ramos.includes("Empresarial") && ramos.length >= 2) {
      sugestoes.push({ clienteId, clienteNome: cliente?.nome, sugestao: "Empresarial", motivo: "Cliente com múltiplos produtos — oportunidade de Empresarial" });
    }
  }

  res.json(sugestoes.slice(0, 20));
});

router.post("/marcar-enviado", async (req, res) => {
  const { apoliceId, diasAntes, mensagem } = req.body;
  if (!apoliceId || !diasAntes) return res.status(400).json({ error: "apoliceId e diasAntes obrigatórios" });

  const [apolice] = await db.select().from(apolices).where(eq(apolices.id, apoliceId));
  if (!apolice) return res.status(404).json({ error: "Apólice não encontrada" });

  await db.insert(renovacoesRegua).values({
    apoliceId,
    clienteId: apolice.clienteId,
    corretorId: apolice.corretorId,
    diasAntes,
    status: "enviado",
    mensagem,
    enviadoEm: new Date(),
  });

  res.json({ ok: true });
});

export default router;
