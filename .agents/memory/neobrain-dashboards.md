---
name: NEOBRAIN Dashboard Render Patterns
description: The 4 role dashboards use two different tab rendering approaches — must match when adding tabs
---

Admin, Parent, Doctor use a `TABS: Record<string, TabComponent>` + main component `TABS[activeTab]?.()` pattern.
Therapist uses `TAB_CONTENT: Record<string, React.ReactNode>` inline JSX inside `export default function`.

**Why:** TherapistDashboard was built with inline JSX (simpler for react-node composition). The other three were built with function references. Mixing patterns causes re-mount issues.

**How to apply:** When adding a new tab to Admin/Parent/Doctor, define a named function component and add it to TABS. When adding to Therapist, add `"tab-id": <TabComponent />` directly in TAB_CONTENT inside the export default function.
