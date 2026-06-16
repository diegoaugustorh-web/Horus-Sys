import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const sinistros = pgTable("sinistros", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  protocolo: text("protocolo").notNull(),
  apoliceId: text("apolice_id"),
  dataOcorrencia: text("data_ocorrencia"),
  descricao: text("descricao"),
  valorEstimado: numeric("valor_estimado").notNull().default("0"),
  status: text("status").notNull().default("Aberto"),
  abertoEm: timestamp("aberto_em").notNull().defaultNow(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertSinistroSchema = createInsertSchema(sinistros).omit({ id: true, criadoEm: true, abertoEm: true });
export type InsertSinistro = z.infer<typeof insertSinistroSchema>;
export type Sinistro = typeof sinistros.$inferSelect;
