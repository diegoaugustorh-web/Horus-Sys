import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const reunioes = pgTable("reunioes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: text("cliente_id"),
  titulo: text("titulo").notNull(),
  dataHora: text("data_hora").notNull(),
  tipo: text("tipo").notNull(),
  modalidade: text("modalidade").notNull(),
  linkReuniao: text("link_reuniao"),
  enviarConvite: boolean("enviar_convite").notNull().default(false),
  notificarCelular: boolean("notificar_celular").notNull().default(false),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertReuniaoSchema = createInsertSchema(reunioes).omit({ id: true, criadoEm: true });
export type InsertReuniao = z.infer<typeof insertReuniaoSchema>;
export type Reuniao = typeof reunioes.$inferSelect;
