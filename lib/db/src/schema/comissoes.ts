import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const comissoes = pgTable("comissoes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  apoliceId: text("apolice_id"),
  corretorId: text("corretor_id"), // ID do usuário responsável
  parcela: integer("parcela").notNull().default(1),
  totalParcelas: integer("total_parcelas").notNull().default(1),
  valor: numeric("valor").notNull().default("0"),
  vencimento: text("vencimento"),
  status: text("status").notNull().default("A Receber"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertComissaoSchema = createInsertSchema(comissoes).omit({ id: true, criadoEm: true });
export type InsertComissao = z.infer<typeof insertComissaoSchema>;
export type Comissao = typeof comissoes.$inferSelect;
