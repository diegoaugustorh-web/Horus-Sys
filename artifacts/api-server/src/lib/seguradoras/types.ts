export type Ramo = "Auto" | "Residencial" | "Vida" | "Empresarial" | "Outros";

export interface CotacaoRequest {
  ramo: Ramo;
  clienteId?: string;
  dados: Record<string, any>; // placa, CEP, idade, etc. conforme o ramo
  seguradoras?: string[]; // filtro opcional
}

export interface CotacaoOferta {
  seguradora: string;
  premio: number;
  franquia?: number;
  coberturas: string[];
  validade?: string;
  raw?: any;
}

export interface CotacaoResult {
  id: string;
  ramo: Ramo;
  ofertas: CotacaoOferta[];
  criadoEm: string;
}

export interface SeguradoraProvider {
  nome: string;
  suporta(ramo: Ramo): boolean;
  cotar(req: CotacaoRequest): Promise<CotacaoOferta[]>;
}
