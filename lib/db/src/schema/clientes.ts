import { pgTable, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const clientes = pgTable("clientes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("PF"),
  cpfCnpj: text("cpf_cnpj"),
  email: text("email"),
  telefone: text("telefone"),
  cidade: text("cidade"),
  observacao: text("observacao"),
  dataNascimento: text("data_nascimento"),
  estadoCivil: text("estado_civil"),
  contatoRecado: text("contato_recado"),
  cep: text("cep"),
  endereco: text("endereco"),
  numero: text("numero"),
  complemento: text("complemento"),
  razaoSocial: text("razao_social"),
  nomeFantasia: text("nome_fantasia"),
  inscricaoEstadual: text("inscricao_estadual"),
  inscricaoMunicipal: text("inscricao_municipal"),
  telefoneComercial: text("telefone_comercial"),
  repNome: text("rep_nome"),
  repCpf: text("rep_cpf"),
  repDataNascimento: text("rep_data_nascimento"),
  repTelefone: text("rep_telefone"),
  produtoId: text("produto_id"),
  produtoCategoria: text("produto_categoria"),
  produtoValorContratado: numeric("produto_valor_contratado"),
  produtoQtdParcelas: integer("produto_qtd_parcelas"),
  produtoValorParcela: numeric("produto_valor_parcela"),
  produtoValorTotalParcelas: numeric("produto_valor_total_parcelas"),
  produtoValorComissao: numeric("produto_valor_comissao"),
  produtoDataAssembleia: text("produto_data_assembleia"),
  produtoResultadoAssembleia: text("produto_resultado_assembleia"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, criadoEm: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
