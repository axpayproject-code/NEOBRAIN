# Running the updated NEOBRAIN

## Setup

1. Install the repository's pnpm dependencies using the checked-in lockfile.
2. Configure private environment variables from `.env.example`. Use a managed PostgreSQL database, TLS, real Resend sender credentials, durable private file storage and a backed-up encryption key.
3. Build project references: `node node_modules/typescript/bin/tsc --build`.
4. Run migrations: `node scripts/migrate.mjs`. It records checksums, serializes concurrent migration attempts and skips the baseline when `users` already exists. Back up production first; rehearse on a restored database. Applied migrations must never be edited afterward.
5. Provision an administrator once: supply `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (12+ characters) and run `node scripts/provision-admin.mjs`. It does not print credentials. Public signup cannot create administrator accounts.
6. Build API: `node artifacts/api-server/build.mjs`.
7. Build frontend: `PORT=25614 BASE_PATH=/ NODE_ENV=production node artifacts/accentecx/node_modules/vite/bin/vite.js build --config artifacts/accentecx/vite.config.ts`.
8. Start from the repository root: `NODE_ENV=production PORT=8080 node artifacts/api-server/dist/index.mjs`. The server serves the built frontend. Deploy behind HTTPS with an external URL matching `APP_ORIGIN`; forward the original host correctly for same-origin protection. Configure your ingress request limits for the 30 MB JSON upload limit. Health endpoint: `/api/healthz`.

Environment variables must be provided by the deployment platform or shell; a `.env` file alone is not automatically loaded. Node 24 users can pass `--env-file=.env` when starting the migration or API commands.

For local frontend development, Vite proxies `/api` to `API_PROXY_TARGET` (default `http://127.0.0.1:8080`). Production cookie security requires HTTPS. Do not use a development authentication configuration in production.

## Payments

Set test PayMongo secret and webhook secret first. Register the signed webhook endpoint `/api/webhooks/paymongo` for checkout paid and refund update events. Verify a real test checkout, failed/cancelled/late payment and refund against your account. Set the actual monthly organization price and supported payment methods. Enable appointment collection only after the merchant/provider collection arrangement is configured. This release tracks collection and refunds; provider split payouts and recurring automatic charging are not implemented.

## Validation commands

- `node node_modules/typescript/bin/tsc --build`
- `node node_modules/typescript/bin/tsc -p artifacts/api-server/tsconfig.json --noEmit`
- `node node_modules/typescript/bin/tsc -p artifacts/accentecx/tsconfig.json --noEmit`
- `node --experimental-strip-types --test artifacts/api-server/tests/case-policy.test.mjs`
- Against an isolated migrated database and running API: `DATABASE_URL=... TEST_ORIGIN=http://127.0.0.1:8080 node scripts/workflow-integration.mjs`. This script creates test accounts and records. Never run it on production.
- With Playwright available and `TEST_ACCOUNTS_PATH` set to the integration test fixture, run `node scripts/workflow-browser.mjs`. `PLAYWRIGHT_MODULE` and `CHROMIUM_MODULE` optionally locate test runtimes. Test fixtures contain session cookies; keep them transient and private.

For a fully disposable local run, install the test-only dependencies with `npm install --prefix scripts/test-runtime`, then run `node scripts/test-full-workflow.mjs`. It creates a fresh PostgreSQL-compatible database, replays migrations twice, launches the built API and a local payment mock, exercises the care flows, and removes its private fixture. `RUN_BROWSER=true` adds browser checks when Playwright/Chromium are available. The runtime uses one application database connection because the WASM socket multiplexer does not support PostgreSQL's full parallel prepared-statement behavior; production defaults to a pool of ten. Application production does not depend on this runtime.

Final implementation checks passed: both application typechecks, project reference build, API/frontend builds, three policy tests, fresh migration/replay and original-schema upgrade, care/payment/onboarding integration suite, all seven dashboard tab sets and mobile overflow checks. Screenshots of the desktop and mobile workspace layouts were visually inspected. Live PayMongo settlement, production PostgreSQL concurrency and production deployment were not tested.

## Operational work before launch

Configure real email, merchant/webhooks, database backups/restore monitoring, encryption key handling, durable file storage and upload quarantine/scanning. Independently verify participating organization affiliations and professional licenses/scopes; establish appointment cancellation/refund and emergency escalation procedures with those organizations. Review actual privacy/consent/retention documents for the deployed service. Import historical clinical records through an explicit clinician approval process rather than bulk-marking them approved.

Current limitations: no automatic provider split settlement, no embedded video meeting engine, no consultation recording, no automated diagnostic video scoring, no automatic clinical credential registry validation, no automated conversion of legacy clinical records, and no production-scale queue worker. The in-process hold cleaner also runs on slot/booking access; multi-instance row locking avoids duplicate expiry updates. Add a durable worker for reminders and large-scale processing. Authentication throttling is process-local; use an ingress/shared limiter for multiple replicas. Program reporting suppresses small counts but is not a formal anonymization guarantee.
