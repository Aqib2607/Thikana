---
name: thikana-design-system
description: Use when creating or reviewing any Thikana UI component or page — colours, type, spacing, radius, shadow, motion, accessibility.
---

# Thikana design system

Tokens live in `src/styles.css`. Raw palette (`--palette-*`) comes from the FurnitureOne reference; components use only semantic aliases (`bg-surface`, `text-muted-foreground`, `text-link`, `bg-inverse`, `border-border-strong`, `text-destructive`).

## Rules
- No raw hex, arbitrary px sizes, or new colours in components. `--palette-error` is the single approved addition.
- Status is never colour-only: pair icon + label (palette has no green/amber).
- `#999999` is decorative only; secondary text uses `text-muted-foreground` (#787878 on white).
- Font: Hind Siliguri (Bangla + Latin). Type scale: text-xs…text-2xl (12–56px).
- Radii: sm 3, md 4, lg 8, xl 10, 2xl 20, 3xl 45, pill 100.
- Motion: `reveal-up` / `--ease-reveal`, `--ease-lift`; always honours reduced motion. Never `transition: all`.
- Verification labels must say "platform verification", never imply government.

## Per-component workflow
Intent → tokens → anatomy/variants → states (default, hover, focus-visible, active, disabled, loading, error, empty) → keyboard/touch → accessibility criteria → one anti-pattern → QA checklist.
