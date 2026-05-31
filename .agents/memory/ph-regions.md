---
name: Philippine Regions single source of truth
description: Where PH_REGIONS lives and how to use it everywhere
---

All region/province dropdowns must import from `@/lib/philippineRegions`:
```ts
import { PH_REGIONS } from "@/lib/philippineRegions";
// shape: { id: string; name: string; provinces?: string[] }[]
```

The reusable `<RegionSelect>` component in `@/components/RegionSelect.tsx` wraps this.
The `<RegionProvinceSelect>` variant supports cascading province selection.

**Why:** Previously Onboarding.tsx had a 21-item hardcoded PROVINCES array; ContactSalesModal had hardcoded DepEd region options. Both replaced with PH_REGIONS in this session.

**How to apply:** Never hardcode province/region lists anywhere in the codebase. Use PH_REGIONS directly or the RegionSelect component.
