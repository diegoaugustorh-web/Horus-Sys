import type { CotacaoRequest, CotacaoOferta, SeguradoraProvider, Ramo } from "./types";

class StubProvider implements SeguradoraProvider {
  nome = "Stub (teste)";
  suporta(_ramo: Ramo) {
    return true;
  }
  async cotar(req: CotacaoRequest): Promise<CotacaoOferta[]> {
    return [
      {
        seguradora: "Tokio Marine (stub)",
        premio: 1250.9,
        franquia: 800,
        coberturas: ["Colisão", "Roubo", "Terceiros"],
        raw: { simulado: true, dados: req.dados },
      },
      {
        seguradora: "Porto Seguro (stub)",
        premio: 1180.5,
        franquia: 950,
        coberturas: ["Colisão", "Roubo"],
        raw: { simulado: true },
      },
    ];
  }
}

class MulticálculoProvider implements SeguradoraProvider {
  nome = "Multicálculo (Aggilizador / SGCOR / BIBlue)";
  suporta(_ramo: Ramo) {
    return true;
  }
  async cotar(req: CotacaoRequest): Promise<CotacaoOferta[]> {
    // TODO: implementar chamada real para a API do multicálculo escolhido
    // Exemplo de endpoint típico: POST https://api.agger.com.br/cotacao
    // Headers: Authorization: Bearer <token>
    console.warn("[Multicálculo] Integração real ainda não configurada. Usando stub.");
    return new StubProvider().cotar(req);
  }
}

export const providers: SeguradoraProvider[] = [new MulticálculoProvider(), new StubProvider()];

export function getProvidersParaRamo(ramo: Ramo): SeguradoraProvider[] {
  return providers.filter((p) => p.suporta(ramo));
}
