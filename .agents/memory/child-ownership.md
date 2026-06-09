---
name: Child ownership enforcement
description: Which roles can create/delete child profiles
---

## Rule
Only `family` and `superadmin` roles can POST /children (create) or DELETE /children/:id.

School, clinic, and government users can:
- GET /children (read their own-userId-scoped list)
- GET /children/:id, GET /children/:id/domain-scores, GET /children/:id/timeline
- POST screenings, appointments, therapy plans linked to existing children

They CANNOT create or delete child profiles.

## Implementation
Both POST /children and DELETE /children/:id perform a DB lookup on the requesting user's role and return 403 if not family or superadmin.

**Why:** Children are owned by families. Other professional roles contribute to the child's care record but do not own the profile.
