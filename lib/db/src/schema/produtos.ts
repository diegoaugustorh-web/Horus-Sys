import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const produtos = pgTable("produtos", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull().default("seguro"),
  tipoPessoa: text("tipo_pessoa").notNull().default("AMBOS"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertProdutoSchema = createInsertSchema(produtos).omit({ id: true, criadoEm: true });
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtos.$inferSelect;
