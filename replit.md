# ACCENTECX AI CARE

A national AI-assisted developmental healthcare infrastructure connecting parents, children, schools, therapists, clinics, and government units into a continuous developmental intelligence system in the Philippines.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/accentecx run dev` — run the frontend (port 25614)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Recharts + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/` — Drizzle table definitions (children, screenings, appointments, therapy_plans, reports, timeline_events)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/accentecx/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server (do not edit)

## Architecture decisions

- Contract-first OpenAPI spec drives both frontend hooks (Orval → React Query) and server validation (Orval → Zod)
- Dashboard "wow" endpoints (`/dashboard/summary`, `/dashboard/activity`, `/dashboard/risk-distribution`) are read-only aggregates — no caching needed at this scale
- Risk level is computed automatically from domain screening scores when a screening is submitted
- Timeline events are appended automatically when children, screenings, appointments, and therapy plans are created

## Product

ACCENTECX AI CARE is a multi-role SaaS healthcare platform with:
- **Landing page** — marketing site for clinics, families, and government buyers
- **Dashboard** — summary stats, risk distribution chart, recent activity feed
- **Children** — digital twin profiles with domain score radar charts and developmental timelines
- **Screenings** — parent questionnaires, teacher reports, clinical intakes, behavioral observations
- **Appointments** — telehealth and in-person scheduling with specialist types
- **Therapy Plans** — speech, OT, behavioral, cognitive, physical, and play therapy tracking
- **Reports** — AI-generated weekly, monthly, and clinical summary reports

## User preferences

- Brand colors from AXPay Remit: dark forest green (#163300) primary, bright lime (#9FE870) accent, white background
- Fonts: Syne (headings), system sans-serif (body)
- Platform targets the Philippines healthcare and developmental pediatrics market

## Gotchas

- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the DB lib must be rebuilt first
- After any OpenAPI spec change, always re-run `pnpm --filter @workspace/api-spec run codegen`
- Timestamp fields in DB are stored as `timestamptz`; always serialize them with `.toISOString()` in route handlers before returning JSON

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
