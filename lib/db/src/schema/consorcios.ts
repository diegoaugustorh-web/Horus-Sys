import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const consorcios = pgTable("consorcios", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: text("cliente_id"),
  administradora: text("administradora"),
  bem: text("bem"),
  grupo: text("grupo"),
  cota: text("cota"),
  valorCredito: numeric("valor_credito").notNull().default("0"),
  prazoMeses: integer("prazo_meses").notNull().default(12),
  taxaAdmPct: numeric("taxa_adm_pct").notNull().default("0"),
  parcela: numeric("parcela").notNull().default("0"),
  inicio: text("inicio"),
  status: text("status").notNull().default("Ativo"),
  observacao: text("observacao"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertConsorcioSchema = createInsertSchema(consorcios).omit({ id: true, criadoEm: true });
export type InsertConsorcio = z.infer<typeof insertConsorcioSchema>;
export type Consorcio = typeof consorcios.$inferSelect;
