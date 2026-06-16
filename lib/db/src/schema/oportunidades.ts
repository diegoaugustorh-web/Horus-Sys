import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const oportunidades = pgTable("oportunidades", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  cliente: text("cliente").notNull(),
  clienteId: text("cliente_id"),
  ramo: text("ramo").notNull().default("Auto"),
  valorEstimado: numeric("valor_estimado").notNull().default("0"),
  estagio: text("estagio").notNull().default("Lead"),
  responsavel: text("responsavel"),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertOportunidadeSchema = createInsertSchema(oportunidades).omit({ id: true, criadoEm: true });
export type InsertOportunidade = z.infer<typeof insertOportunidadeSchema>;
export type Oportunidade = typeof oportunidades.$inferSelect;
