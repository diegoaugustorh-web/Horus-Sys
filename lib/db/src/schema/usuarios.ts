import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  nome: text("nome"),
  role: text("role").notNull().default("corretor"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ criadoEm: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;
