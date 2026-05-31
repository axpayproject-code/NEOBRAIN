---
name: NEOBRAIN API auth header pattern
description: How frontend components authenticate API calls that don't go through react-query hooks
---

For direct fetch() calls to `/api/billing/*` and `/api/tickets/*` (endpoints not in OpenAPI spec):
- Header: `Authorization: Bearer <userId>` where userId is from `useAuth().user?.id`
- The API server extracts the caller from this header for admin role checks
- Do NOT use JWT or session cookies for these calls; userId is the auth token

**Why:** The billing and tickets routes were built before full auth middleware was wired; they use a lightweight userId-based auth check.
