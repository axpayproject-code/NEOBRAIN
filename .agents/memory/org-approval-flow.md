---
name: Org Approval Flow
description: How clinic/school/gov account registration and admin activation works
---

## Rule
Clinic, school, and government accounts are created with `subscriptionStatus = "pending_org_activation"`. They cannot access their dashboards until a superadmin activates them.

## How to apply
- `auth.ts` signup: `needsOrgApproval = role === "clinic" || role === "school" || role === "government"` → sets `pending_org_activation`
- `App.tsx` ProtectedRoute: checks `user.subscriptionStatus === "pending_org_activation"` → redirects to `/pending-approval`
- `PendingApproval.tsx` page: branded holding page with "Check Status" button that reloads the page
- Admin endpoints in `admin.ts`: `GET /admin/orgs/pending`, `POST /admin/orgs/:id/activate` (sets active + sends email), `POST /admin/orgs/:id/reject` (deletes account + sends email)
- `AdminApprovalsTab.tsx` has 3 tabs: Subscriptions | Appointments | Organizations

**Why:** Orgs need vetting before accessing sensitive child health data. Families get immediate access (14-day trial).

**How to apply:** When adding new org-type roles in the future, add them to the `needsOrgApproval` condition in `auth.ts`.
