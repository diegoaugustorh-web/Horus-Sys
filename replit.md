# Hórus CRM

CRM completo para corretoras de seguros brasileiras — gerencia clientes, apólices, pipeline, comissões, sinistros, reuniões, consórcios e produtos.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path `/api`)
- `pnpm --filter @workspace/horus-crm run dev` — run the CRM frontend (port 26061, path `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk setup

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TanStack Query + Wouter + shadcn/ui + Clerk Auth
- API: Express 5 + Clerk middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema files (one per entity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/horus-crm/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed hooks. Never hand-write what codegen produces.
- Clerk for auth: cookie-based session on web. No Bearer tokens in browser requests.
- First registered user becomes admin (role logic in `routes/usuarios.ts`).
- All numeric DB fields (numeric/decimal) are cast to `Number()` in route handlers before returning to client.
- Roles: `admin`, `corretor`, `atendente` — enforced at route level via `requireAuth` + user role lookup.

## Product

- **Dashboard**: KPIs (prêmio total, apólices vigentes, a renovar, sinistros abertos, comissões a receber, pipeline)
- **Clientes**: CRUD completo para PF e PJ com todos campos do cadastro
- **Apólices**: Gerenciamento de apólices por ramo (Auto, Vida, Residencial, Empresarial, Saúde, Viagem)
- **Pipeline**: Kanban de oportunidades com arrastar entre estágios (Lead → Cotação → Proposta → Negociação → Ganho/Perdido)
- **Reuniões**: Agendamento de reuniões com clientes (presencial/online)
- **Comissões**: Controle de comissões (A Receber, Recebida, Atrasada)
- **Sinistros**: Gestão de sinistros com workflow de status
- **Consórcios**: Gerenciamento de cotas de consórcio
- **Produtos**: Catálogo de produtos (seguros e consórcios) com toggle ativo/inativo
- **Usuários**: Gestão de usuários e papéis (apenas admin)

## User preferences

- Interface em Português (Brasil)
- Formatação de moeda em R$
- Sem emojis na interface

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before typechecking artifact packages.
- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`.
- Clerk proxy middleware must be mounted BEFORE body parsers in `app.ts`.
- `VITE_CLERK_PROXY_URL` is empty in dev (intentional) — do not add conditional logic around it.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk integration details
