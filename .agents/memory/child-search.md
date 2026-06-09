---
name: Child Search
description: Cross-role child search architecture and component location
---

## Rule
`GET /api/children/search?q=` returns children matching the name query, role-scoped. The `ChildSearchBar` React component wraps this with debounced input, dropdown results, and a selected-child detail card.

## How to apply
- Endpoint in `artifacts/api-server/src/routes/children.ts` — looks up user role via `usersTable`, then queries `childrenTable` with `ilike`. Family role is scoped to own children only; all org roles and superadmin see all matching.
- Enriches each result with: `latestScreening`, `latestAppointment`, `activeTherapyPlan`
- Component at `artifacts/accentecx/src/components/shared/ChildSearchBar.tsx`
- Integrated into: `TherapistDashboard` (school overview), `DoctorDashboard` (patient queue), `AdminDashboard` (national overview)

**Why:** Schools, clinics, and government need to look up any child across the ecosystem to see who is treating them, what school they attend, and what plans are active — without needing separate data-sharing agreements.
