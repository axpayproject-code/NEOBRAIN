# NEOBRAIN case workflow implementation

This branch is the first implementation milestone, not the complete seven-workspace production platform.

## Preserved
Existing branding, logos, theme colors, typography, dashboard shell, responsive navigation and UI component library.

## Implemented
- Database-backed, hashed, 24-hour HttpOnly cookie sessions. Legacy bearer identity is replaced with server-verified identity before legacy handlers run.
- Public administrator registration rejected; login role comes from the database.
- Protected legacy page routes and session hydration; query caches cleared between accounts.
- Case Workspace in family, clinic and platform administrator dashboards.
- Guardian-owned case submission with consent acknowledgment and eligibility from birth through the whole twelfth year.
- Professional specialty/credential submission and explicit administrator verification.
- Assignment to verified reviewers, reviewer acceptance, internal worknotes, information requests and follow-up tasks.
- Separate clinical result versions; only approved results are returned to the family. Approval is atomic and audited. SQL trigger makes approved versions immutable.
- New result versions for amendments require fresh approval.
- Referral task creation only after clinical review approval.
- Automated Gemini clinical video scoring disabled.
- Legacy clinical endpoints and other unscoped operations fail closed until migrated; this intentionally makes affected old tabs unavailable rather than preserve unsafe access.
- Legacy child responses do not expose unreviewed risk labels or diagnosis notes; family input cannot set clinical or ownership fields.

## Database rollout
Back up and test on an isolated database first. Do not run schema push against the production database as a substitute for reviewing the migration.

Apply `lib/db/migrations/001_case_workflow.sql` to the existing PostgreSQL database using the deployment's migration runner or:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f lib/db/migrations/001_case_workflow.sql
```

Deploy API and frontend together. Existing users must sign in again; old browser-stored IDs are no longer valid authentication.
Use the existing independently provisioned administrator account to activate organization accounts, verify professional credentials and assign reviews.
This milestone does not create default administrator credentials.

## Local operation
Required: `DATABASE_URL`, Node, pnpm; frontend also requires `PORT` and `BASE_PATH`.
Use existing package development/build scripts. Run backend and frontend through the same origin/proxy because authentication uses cookies.
Optional email: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
No PayMongo credentials are requested or added in this milestone.

## Verified
- Shared libraries, API and frontend TypeScript compilation.
- API bundle and production frontend bundle.
- Policy tests: unrelated case access denied, unapproved result filtering, exact age boundaries.

## Still required before production
- Live database migration and transactional integration tests.
- Organization memberships, verified guardian relationships, delegated case access and coordinator permissions; current assignment is platform-admin only.
- Fine-grained professional approval scopes, credential expiration/revocation and verification evidence.
- Stronger consent records, withdrawal, retention, contact verification enforcement, rate limits and safeguarding operating procedures.
- Private original video/document storage and authorized uploads.
- Full referral lifecycle, receiving-provider acceptance, appointments and encounters.
- PayMongo orders, signed webhooks, reconciliation, refunds and approved Platforms onboarding if splitting payments.
- Seven fully operational workspaces, genuine aggregate analytics and approved data imports.
- Migrate each legacy feature into case-scoped APIs before re-enabling it.
- Complete OpenAPI coverage for the new routes; this milestone uses a small typed frontend adapter.
- Visual/browser QA and representative usability testing. A mocked browser smoke test was attempted, but Chromium was unavailable and its download failed in this environment.

Do not treat compilation or the policy tests as clinical validation, security certification or a successful deployment.
