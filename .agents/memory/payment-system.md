---
name: Manual payment system
description: How the GCash/BPI proof-upload billing flow works end-to-end
---

## Flow
1. Family selects paid plan on Billing.tsx → picks GCash or BPI → gets TXN reference code
2. Uploads payment screenshot (base64, max 4MB) + enters GCash/bank reference number
3. POST /billing/subscribe stores: subscriptionStatus=pending_verification, requestedPlan, requestedBillingCycle, paymentProofUrl (base64), subscriptionRef
4. Admin sees entry in Approval Queue (AdminApprovalsTab) → clicks "View Proof" to fetch image from GET /admin/users/:id/payment-proof
5. Approve → POST /billing/activate → reads requestedPlan from DB and sets subscriptionTier to it, clears proof + pending fields, sends approval email
6. Reject → POST /billing/reject → reverts to free, clears all proof/pending fields, sends rejection email with optional reason

## DB columns added to usersTable
- `payment_proof_url text` — base64 data URL of uploaded screenshot (stripped from list endpoints, only returned by /admin/users/:id/payment-proof)
- `requested_plan text` — the plan tier being requested (e.g. "care-plus")
- `requested_billing_cycle text` — "monthly" or "annual"

## Key design decisions
- **paymentProofUrl is never included in /admin/users list** — only returned on demand via the dedicated proof endpoint (prevents huge payloads)
- **activate uses requestedPlan** not the current subscriptionTier — this is how upgrade AND downgrade both work
- **reject always reverts to free** — clears all subscription data, sends email with optional reason
- **Downgrade to free**: family can submit a downgrade request via POST /billing/downgrade-request (no payment needed), admin approves via same activate endpoint

**Why:** Philippines market uses manual payment (GCash is dominant), so no Stripe/automated billing. Admin must verify receipts before granting plan access.
