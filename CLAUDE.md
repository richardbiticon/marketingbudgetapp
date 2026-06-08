# CLAUDE.md

All Volleyball marketing budget tool. Next.js App Router + TypeScript + Tailwind,
Neon Postgres via Drizzle, Zod, Recharts, Framer Motion.

## Rules
- Money is stored in cents (`amount_cents`). Never store a computed total. All
  rollups derive from the `expenses` table at query time (see `lib/rollups.ts`).
- No localStorage or sessionStorage for any data. State is server side in Postgres.
- CRUD lives in `app/api/*` Route Handlers, validated with Zod (`lib/validation.ts`).
- The DB client is lazy (`lib/db.ts`) so the app builds without `DATABASE_URL`.
- Brand: background `#1a1a1a`, primary red `#D7172A` (or `#C8102E`), cream for
  Retail, slate for Shared. Never `#CE1126`. Mono uppercase eyebrows like `/ BUDGET`.
- Copy: no em dashes. Avoid: solutions, premium, bulk, elevated, leverage,
  ecosystem, synergy, world class, best in class.

## Commands
- `npm run dev` start. `npm run build` build.
- `npm run db:push` create or update tables. `npm run db:seed` load placeholder month.

## Layout
- `lib/` schema, db, constants, validation, format, rollups.
- `components/` BudgetApp orchestrator plus view components and `components/ui/*` primitives.
- `app/api/` expenses, targets, settings handlers.
