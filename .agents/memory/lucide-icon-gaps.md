---
name: Lucide icon gaps
description: Lucide-react icons that do NOT exist and their safe replacements.
---

These icons are NOT exported by `lucide-react` (as of the version pinned in this project):

| Missing icon | Replacement |
|---|---|
| `FilePdf` | `FileText` |
| `FileCsv` | `FileText` or `Table2` |
| `FileFhir` | `Database` |

**Why:** lucide-react's icon set does not include file-type-specific PDF/CSV variants. Always verify with `grep -r "from \"lucide-react\""` or check [lucide.dev](https://lucide.dev) before using an unfamiliar icon name.

**How to apply:** When building file export or document-type UI, use `FileText` (generic doc), `FileJson` (JSON), or `Database` (structured/FHIR) instead of format-specific names.
