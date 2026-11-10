import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const renovacoesRegua = pgTable("renovacoes_regua", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  apoliceId: text("apolice_id").notNull(),
  clienteId: text("cliente_id"),
  corretorId: text("corretor_id"),
  diasAntes: integer("dias_antes").notNull(), // 90, 60, 30, 15, 7
  status: text("status").notNull().default("pendente"), // pendente, enviado, ignorado, convertido
  mensagem: text("mensagem"),
  canal: text("canal").default("whatsapp"),
  enviadoEm: timestamp("enviado_em"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertRenovacaoReguaSchema = createInsertSchema(renovacoesRegua).omit({ id: true, criadoEm: true });
export type InsertRenovacaoRegua = z.infer<typeof insertRenovacaoReguaSchema>;
export type RenovacaoRegua = typeof renovacoesRegua.$inferSelect;
