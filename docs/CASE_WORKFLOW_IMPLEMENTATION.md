# NEOBRAIN complete workflow update

This replaces the first workflow milestone. Existing NEOBRAIN logo, colors, typography, public shell, and dashboard shell remain. The operational dashboard routes use real API records; legacy operational pages redirect into the new workspaces. Legacy clinical endpoints, including Gemini video scoring, are disabled. Existing legacy data is retained but is not automatically treated as approved clinical data.

## Seven workspaces

| Workspace | Route | Working features | Bill owner |
|---|---|---|---|
| Family | `/family` | Ages 0–12, child profiles, history/observations, private evidence, case submission, guardian sharing and withdrawal, released results, tasks, referrals, bookings, payments, sponsorship requests | Documentation free; guardian pays booked service unless sponsored |
| Clinical | `/clinic` | Credentials, affiliations, accepted assignments, worknotes, result drafts and approvals, referrals, availability with fees/terms, remote/onsite consultation, encounter approval, content review | Organization subscription includes authorized staff |
| Coordination | `/coordination` | Organization work queue, assignment, reassigning declined reviews, information requests, follow-up, referral closure, appointment visibility | Organization |
| School/ECCD | `/school` | Guardian-authorized learner records, classroom observations, support progress/messages, approved resources; clinical information requires separate sharing consent | Participating school/organization |
| Government/program | `/government` | Organization-scoped counts with small-count suppression, provider directory, programs and sponsorship requests | Organization/program contract; sponsor funds care |
| Organization | `/organization` | Registration, invitations, team roles/revocation, organization reporting, sponsor budgets, subscription orders | Organization manager represents the contracting organization |
| Platform | `/admin` | Organization activation, credential evidence/scopes/expiry/revocation, case routing metadata, content drafts, audits, payment operations | Platform operator; no separate dashboard fee |

A base account role selects the initial workspace. Memberships grant additional workspaces. Clinical authority additionally requires independently verified credentials, unexpired validity and an authorized result scope. Organization activation and credential verification are separate actions. A platform administrator's account alone does not expose clinical results.

## Care workflow

1. Account signup → email verification → responsibility acknowledgment. A guardian attests their relationship before enrolling a child. Organizations register and await activation; staff accept an expiring invitation matching their verified email. Administrators verify each clinician's evidence and approval scopes.
2. Guardian creates free child documentation and a case, chooses the responsible organization, and authorizes sharing. School/frontliner access uses explicit grants. Documents/videos are private evidence for human review.
3. Organization coordinator routes the case to a verified affiliated reviewer. Reviewer accepts or declines. Worknotes stay with authorized clinicians. Draft clinical results never appear to families or schools.
4. Verified clinician approves, returns or rejects their draft within their scope. An approved version has an approver and timestamp and cannot be updated or deleted, enforced in PostgreSQL. Amendments are new versions requiring new approval.
5. Clinician creates a referral backed by an approved result. Guardian authorizes disclosure to the receiving provider; the provider accepts/declines. Booking can link an accepted referral matching the provider and facility.
6. Provider publishes availability, mode, fee and cancellation terms. Guardian reserves a slot and consents to provider sharing. Free visits confirm immediately; paid visits have a 30-minute hold. Payment or authorized sponsorship confirms the appointment. Expired holds release the slot. Database row locks prevent booking the same available slot twice.
7. Remote: provider supplies an HTTPS meeting link → guardian supplies callback/current location at check-in → clinician starts the encounter → consultation occurs through the external provider link → clinician saves/approves the report → follow-up. No automatic recording.
8. Onsite: facility/preparation instructions → check-in → waiting → clinician starts encounter → clinician saves/approves report → follow-up. The same approval rules apply.
9. Provider records the reviewed referral outcome; coordinator closes the referral. Task assignees record completion. Notifications link the operational steps.

## Architecture

React/Vite + existing Tailwind/Radix shell → same-origin Express API → PostgreSQL/Drizzle. API server also serves the frontend build. The new `/api/workflow/*` routes implement case access, organization membership, clinical authority and state transitions. Authentication uses opaque random HttpOnly session cookies; only hashes are stored. Client-supplied user IDs/roles cannot establish a session. Requests with a different Origin host are rejected. Email verification gates child records. Password reset revokes sessions.

`case_workflow.ts` contains sessions, cases, professional authority, result versions and tasks. `platform.ts` adds organizations/memberships/invitations, explicit case grants, observations, referrals, availability, bookings, encounters, orders/webhook receipts, attachments, notifications, onboarding, programs and professionally approved resources. Database migrations add foreign keys, financial checks, access indexes and immutable approval triggers.

Private file upload accepts PDF/PNG/JPEG/MP4 up to 20 MB, validates declared type against file signatures, stores a random filename outside static hosting and checks case access on every download. Production requires AES-256-GCM encryption. This is signature validation, not a malware scanner. Deploy a scanning/quarantine service before accepting untrusted public uploads at scale; private storage and key backup/rotation remain operator responsibilities.

## Payment and business controls

Family documentation is not subscription-gated. A fee is charged for a booked professional service, not for uploading history, receiving an approval, or merely creating a referral. Organizations receive one contracted subscription bill; seven dashboards do not mean seven subscriptions. Organizations/programs may sponsor service fees with an explicit guardian request and budget authorization.

PayMongo checkout is server-created from the recorded fee in PHP centavos. Payment secrets remain server-side. Success redirects never approve payment or clinical findings. Reconciliation and signed webhooks retrieve the canonical checkout from PayMongo and verify paid amount/currency. Duplicate receipts are idempotent. A paid subscription extends the organization's paid-until period once. Refund requests and confirmed refund events are tracked separately. Money arriving after cancellation/expiry is flagged for refund review. Sponsored cancellation releases the budget commitment.

The current collection integration uses one configured merchant account; it does not implement automatic provider split settlement or a recurring debit mandate. Appointment collection is deliberately unavailable until `PAYMONGO_PROVIDER_COLLECTION_APPROVED=true`. The operator must configure the actual merchant/provider collection agreement and settlement process, price, cancellation terms and permitted payment methods. Subscription activation does not automatically change clinician authority or remove access to existing family documentation.

## Deployment and verification

See `.env.example` and `docs/DEPLOYMENT.md`. Fresh databases use `000_baseline.sql`; existing original databases skip it. `001` and `002` upgrade the schema. Never run `drizzle push` against an existing production database to substitute for these migrations. Back up and test on a restored copy first.

Verified during implementation: TypeScript project references and both application typechecks; frontend/backend production builds; original-schema → 001 → 002 upgrade in PGlite (PostgreSQL-compatible); API integration tests for assignment, disclosure, approvals/immutability, referrals, remote/onsite encounters, booking collision, private files, consent withdrawal and credential revocation; mocked PayMongo checkout, webhook signature/duplicate events, refund requests, subscription idempotency and sponsorship.

A local mock verifies application behavior, not a live PayMongo account. The local PostgreSQL-compatible runtime is not a substitute for testing deployment concurrency against managed PostgreSQL. Browser checks and any remaining limitations are recorded in `docs/DEPLOYMENT.md`. No production database migration, real payment or deployment has been executed by this update.
