---
name: design-system-furnitureone-premium-furniture-website-template
description: >
  Apply the FurnitureOne premium furniture website template design system when building or updating UI.
  Use when creating components, choosing colors or typography,
  or reviewing designs for marketing interfaces.
---

# FurnitureOne premium furniture website template — Design System Skill

## When to Use

- Building new UI components for FurnitureOne premium furniture website template.
- Reviewing or updating existing component styles.
- Choosing colors, typography, or spacing for marketing pages.
- Checking designs against the extracted token set.

## Context

- **Product:** FurnitureOne premium furniture website template — https://furnitureone.framer.ai/
- **Surface:** marketing
- **Audience:** Business decision-makers and potential customers
- **Character:** Conversion-focused marketing presence with a rich, diverse color palette and 6 typefaces.

## Tokens

### Colors

| Token | Value | Role |
|-------|-------|------|
| --border-color | `#787878` | Border |
| --border-color | `#C4C4C4` | Border |
| --text | `#FFFFFF` | Text Light |
| color-10 | `#EDF1F4` | Background |
| color-7 | `#E8E8E8` | Surface |
| color-8 | `#EDEDED` | Surface |
| color-1 | `#000000` | Text Primary |
| color-2 | `#0000EE` | Text Primary |
| color-4 | `#999999` | Text Secondary |
| color-5 | `#BBBBBB` | Background Dark |
| color-9 | `#EDF0F3` | Text Light |
| color-11 | `#F5F5F5` | Text Light |

### Typography

**Font stack:** Inter, Geist, Montserrat, sans-serif, Times New Roman, Inter Display

| Level | Size | Usage |
|-------|------|-------|
| text-xs | 12px | Captions, metadata |
| text-sm | 14px | Labels, secondary text |
| text-base | 16px | Body text (default) |
| text-lg | 20px | Subheadings, emphasis |
| text-xl | 40px | Section headings |
| text-2xl | 56px | Section headings |

**Weight scale:** 300 · 400 · 500 · 600
**Line heights:** 52px · 16.8px · 12px · 72.8px · 22.4px · 32px · 30px · 20.8px · 25.6px · 14.4px · 14px · 24px

### Spacing

**Base unit:** 4px

`space-1: 4px` · `space-2: 6px` · `space-3: 8px` · `space-4: 9px` · `space-5: 10px` · `space-6: 12px` · `space-7: 15px` · `space-8: 16px` · `space-9: 17px` · `space-10: 18px` · `space-11: 20px` · `space-12: 24px` · `space-13: 25px` · `space-14: 30px` · `space-15: 40px` · `space-16: 50px` · `space-17: 60px` · `space-18: 80px` · `space-19: 100px`

### Shapes

**Border radius:** `radius-sm: 3px` · `radius-md: 4px` · `radius-lg: 8px` · `radius-xl: 10px` · `radius-full: 11px` · `radius-6: 20px` · `radius-7: 45px` · `radius-full: 50%` · `radius-9: 64px` · `radius-10: 100px` · `radius-11: 150px`

### Elevation

- **shadow-sm:** `rgb(0, 0, 0) 0px 0px 0px 1px inset`
- **shadow-md:** `rgba(0, 0, 0, 0.17) 0px 0.602187px 1.56569px -1.5px, rgba(0, 0, 0, 0.14) 0px 2.28853px 5.95019px -3px, rgba(0, 0, 0, 0.02) 0px 10px 26px -4.5px`

### Motion

- **duration-fast:** `all`
- **duration-fast:** `background, box-shadow`
- **duration-fast:** `none`
- **duration-slow:** `clip-path 1s cubic-bezier(0.65, 0, 0.2, 1), transform 1.3s cubic-bezier(0.2, 0.7, 0.2, 1)`

## Component Inventory

- **Buttons:** 3 detected
- **Links:** 32 detected
- **Inputs:** 14 detected
- **Navigation:** 4 elements
- **Lists:** 6 detected
- **Forms:** 1 detected
- **Images:** 98 detected

## Constraints

### Always

- Use tokens from the tables above — do not introduce new values.
- Include hover, focus-visible, and disabled states for interactive elements.
- Follow the 4px spacing grid.
- Meet WCAG 2.2 AA contrast minimums.

### Never

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not mix border-radius values. Pin to the detected set (3px, 4px, 8px, 10px, 11px, 20px, 45px, 50%, 64px, 100px, 150px).
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or documenting a component for this system:

1. State intent — one sentence on purpose.
2. Map tokens — list every token the component uses.
3. Define anatomy — named parts with token assignments.
4. Specify states — default, hover, focus-visible, active, disabled, loading, error, empty.
5. Describe interactions — keyboard, pointer, touch, edge cases.
6. Add a11y criteria — testable pass/fail checks.
7. List anti-patterns — concrete misuse examples.
8. Close with the Definition of Done checklist.

## Output Structure

Component guidelines must contain, in order:

1. Overview (purpose, when to use, when not to use)
2. Tokens and foundations
3. Anatomy, variants, responsive behavior
4. States and interactions
5. Accessibility (ARIA, contrast, focus, screen reader)
6. Content guidelines (copy rules, tone)
7. Anti-patterns with reasoning

## Component Requirements

- Reference only tokens from the tables above.
- Define all states: default, hover, focus-visible, active, disabled, loading, error.
- Handle edge cases: empty, overflow, truncation, max content.
- Include keyboard navigation behavior.
- Document ARIA roles and labels.

## Definition of Done

- Default state renders (smoke test).
- All states visually verified.
- Zero hardcoded visual values — tokens only.
- Keyboard navigation works without pointer.
- No critical a11y violations.
- Tested at min and max breakpoint.
- At least one anti-pattern documented.
- Purpose, usage, and limitations documented.
