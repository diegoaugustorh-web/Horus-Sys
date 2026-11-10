import { Router } from "express";
import { randomUUID } from "crypto";
import { getProvidersParaRamo } from "../lib/seguradoras/providers";
import type { CotacaoRequest, CotacaoResult } from "../lib/seguradoras/types";

const router = Router();

router.post("/cotacao", async (req, res) => {
  const body = req.body as CotacaoRequest;
  if (!body.ramo || !body.dados) {
    return res.status(400).json({ error: "ramo e dados são obrigatórios" });
  }

  const providers = getProvidersParaRamo(body.ramo);
  const ofertas = [];

  for (const provider of providers) {
    try {
      const result = await provider.cotar(body);
      ofertas.push(...result);
    } catch (err) {
      console.error(`[${provider.nome}] falha na cotação:`, err);
    }
  }

  const result: CotacaoResult = {
    id: randomUUID(),
    ramo: body.ramo,
    ofertas,
    criadoEm: new Date().toISOString(),
  };

  res.json(result);
});

router.get("/provedores", (_req, res) => {
  res.json({
    provedores: [
      {
        nome: "Multicálculo (Aggilizador / SGCOR / BIBlue)",
        status: "stub",
        descricao: "Configure as credenciais no .env para ativar",
      },
      { nome: "Tokio Marine (direto)", status: "pendente", descricao: "Portal: portalparceiros.tokiomarine.com.br" },
      { nome: "Bradesco Seguros (direto)", status: "pendente", descricao: "Portal: apiportal.bradescoseguros.com.br" },
    ],
  });
});

export default router;
