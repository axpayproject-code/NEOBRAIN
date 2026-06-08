---
name: Type field corrections
description: Correct field names on generated API types — common mistakes when writing components against the schema.
---

These are the actual field names on generated types in `lib/api-client-react/src/generated/api.schemas.ts`. These differ from what you might intuitively guess.

## TimelineEvent
- `occurredAt` — NOT `createdAt`. Always sort/display using `event.occurredAt`.

## Screening
- No `screenedBy` field — use `childName` (nullable) if you need a name.
- No `notes` field — use `clinicalSummary` (nullable) for free-text clinical notes.

## Appointment
- No `appointmentType` field — use `telehealth: boolean` to distinguish telehealth vs in-person.
- Has `durationMinutes`, `status`, `specialistType`, `scheduledAt`, `meetingUrl`, `notes`, `paymentStatus`, `feeAmount`.

## Report
- No `status` field — use `urgencyLevel` (nullable `ReportUrgencyLevel`) instead.
- Has `findings`, `recommendations`, `summary` (all nullable).

**Why:** The OpenAPI spec was authored with these names, and Orval generates types verbatim. The mismatches are not bugs — they are intentional domain model choices.
