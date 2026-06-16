import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const apolices = pgTable("apolices", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  numero: text("numero").notNull(),
  clienteId: text("cliente_id"),
  seguradora: text("seguradora"),
  ramo: text("ramo").notNull().default("Auto"),
  premio: numeric("premio").notNull().default("0"),
  inicio: text("inicio"),
  fim: text("fim"),
  status: text("status").notNull().default("Vigente"),
  comissaoPct: numeric("comissao_pct").notNull().default("0"),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertApoliceSchema = createInsertSchema(apolices).omit({ id: true, criadoEm: true });
export type InsertApolice = z.infer<typeof insertApoliceSchema>;
export type Apolice = typeof apolices.$inferSelect;
