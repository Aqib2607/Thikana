# Thikana — Phase 1 plan: inspection and UI foundation

## What I found in the project

- A fresh, empty starter app: React + TypeScript + Vite + Tailwind, with TanStack Router (file-based) and TanStack Query already installed. No pages exist yet beyond a placeholder home.
- No Laravel backend or API contract is in this project. All data screens will use a clearly separated, typed mock adapter until real endpoints are shared.
- Routing: the existing router is fixed and will be reused. The documented URLs map cleanly to it (`/properties/$propertyId` style params).

## Conflicts that need your decision (summarised in the questions)

1. **Bangla font** — the reference font stack (Inter/Geist/Montserrat) has no Bengali glyphs. Proposal: add Hind Siliguri (Bangla + Latin) via Google Fonts, Inter kept for English numerals/UI.
2. **Status colours** — the palette is greyscale plus link blue `#0000EE`; it has no success/warning/error colours. Proposal: keep the palette, communicate status with icons + labels + pattern; add only one error red (needed for form errors to be noticeable). Needs approval.
3. **Grey text contrast** — `#999999` on `#EDF1F4` fails WCAG AA (about 2.6:1). Proposal: use it only for decorative/large text; secondary body text uses `#787878` on white (4.5:1) instead.
4. **Dependencies** — i18next, react-i18next, react-hook-form, zod, @hookform/resolvers, leaflet, react-leaflet, lucide-react. Phase 1 installs only i18n packages; others come in their phases.

## Phase 1 deliverables (about 12 files)

- `src/styles.css` — map the reference tokens (colour, spacing, radius, shadow, motion, type scale) to semantic aliases; reduced-motion rules.
- `src/routes/__root.tsx` — font links, Thikana metadata, Toaster, i18n provider, `lang` attribute.
- `src/lib/i18n.ts` + `src/locales/bn.json`, `src/locales/en.json` — Bangla default, English secondary, persisted choice.
- `src/components/brand/ThikanaLogo.tsx` — scalable SVG wordmark + house-pin icon (no government styling).
- `src/components/layout/AppShell.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`, `LanguageSwitcher.tsx`.
- `src/routes/index.tsx` — public marketing home shell (search-first hero) to prove the foundation; full discovery comes in Phase 3.
- `src/lib/api/` — typed client interface + `mock/` adapter skeleton (no invented endpoints; gaps listed in a `CONTRACT-GAPS.md`).
- `.agents/skills/thikana-design-system/SKILL.md` — design-system discipline adapted from the reference skill.
- `AGENTS.md` — record architecture rules.

## Later phases (each stops for approval)

2 Auth screens + role layouts — 3 Discovery (search, filters, list/map, details) — 4 Tenant features — 5 Landlord features — 6 Admin — 7 Integration and QA.

## Notes on governance items I cannot follow literally

- Git branches/commits are managed by Lovable automatically, so `agent/thikana` and commit message formats are not applicable.
- Hosting on Render: the app can be exported via GitHub later; Lovable preview is used for verification.
