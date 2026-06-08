# All Volleyball. Marketing Budget

Internal marketing budget tool. Every figure persists to Postgres, so a teammate
adds an expense on one computer and the rest of the team sees it after a refresh.
Dark, precise, on brand. Built to feel like a luxury car configurator.

## Stack
Next.js (App Router) + TypeScript, Tailwind, shadcn-style UI on Radix, Framer Motion,
Recharts, Neon Postgres via Drizzle ORM, Zod validation. CRUD through Route Handlers
in `app/api/*`. Server component loads the initial month, the client does optimistic
mutations and refetches on window focus.

## Run it locally

1. Install:
   ```
   npm install
   ```

2. Create a database. Go to https://neon.tech, make a free project, and copy the
   pooled connection string. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require
   ```

3. Add it to `.env`:
   ```
   cp .env.example .env
   # then paste your string after DATABASE_URL=
   ```

4. Create the tables and seed the placeholder month:
   ```
   npm run db:setup
   npm run db:seed
   ```
   (`db:setup` applies the schema non-interactively. `db:push` via drizzle-kit also
   works but prompts for confirmation.)

5. Start it:
   ```
   npm run dev
   ```
   Open http://localhost:3000. Until the database is connected the app shows a setup
   screen with these same steps.

## Deploy to Vercel
1. Push this repo to GitHub and import it in Vercel.
2. In Project Settings, Environment Variables, add `DATABASE_URL` with your Neon
   pooled string. Add it for Production and Preview.
3. Deploy. Then run `npm run db:push` and `npm run db:seed` once against the same
   `DATABASE_URL` (from your machine or a Vercel build step) so the live database
   has its tables and the placeholder month.

## Data model
- `expenses`: id, name, channel, category, amount_cents, period (YYYY-MM), type,
  status, vendor, notes, created_at, updated_at.
- `targets`: id, period, category, target_pct.
- `settings`: monthly_budget_cents, test_innovation_pct.

Money is stored in cents. Every rollup (totals, percent of spend, channel chart,
target vs actual, carve-out) is derived from the expenses table at query time.
Nothing computed is stored.

## Views
1. Overview and P&L. Monthly total plus Team, Retail, Shared cards. Test and
   Innovation carve-out tracker. Month switcher top right reflows everything.
2. Spend by channel. Horizontal bars, longest at top, colored by category.
3. Target mix vs actual. Per category target vs actual, dollar variance, over in red.
   Set targets inline.
4. Expenses table. Full CRUD, inline edit, delete with confirm, filter by channel,
   category, status, text search, sortable columns, CSV export of the filtered view.
5. Add expense. Validated dialog, optimistic insert, then persist.

## The carve-out
Tag any expense note with `[test]` and its amount counts toward the Test and
Innovation carve-out tracker.

## Recurring expenses
Recurring rows are tagged with type `recurring`. When you open a future month with
none of them present, re-add them from the previous month, or duplicate a row. Kept
simple and explicit on purpose.

## Forks taken (per the brief)
- The channel chart is hand built for exact control of the longest-at-top layout and
  the width-in animation. Recharts drives the category mix donut on the Overview.
- The period filter for every view is the month switcher in the header. The expenses
  table adds channel, category, status, and text filters on top.

## Copy rules
No em dashes. Plain specific labels. Banned words stay out.
