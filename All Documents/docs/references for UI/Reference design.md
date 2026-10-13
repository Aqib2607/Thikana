# FurnitureOne premium furniture website template

## Overview

**Product:** FurnitureOne premium furniture website template
**URL:** https://furnitureone.framer.ai/
**Surface type:** marketing
**Audience:** Business decision-makers and potential customers
**Brand character:** Conversion-focused marketing presence with a rich, diverse color palette and 6 typefaces.

> **Note:** Surface detection confidence is low. Verify the inferred audience and brand context before relying on this file.

### Design Principles

- Consistency over novelty — reuse existing patterns before inventing new ones.
- Token-driven — every visual decision references a token, not a magic number.
- Accessible by default — compliance is a baseline, not a feature.

## Colors

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

## Typography

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

## Spacing

**Base unit:** 4px

`space-1: 4px` · `space-2: 6px` · `space-3: 8px` · `space-4: 9px` · `space-5: 10px` · `space-6: 12px` · `space-7: 15px` · `space-8: 16px` · `space-9: 17px` · `space-10: 18px` · `space-11: 20px` · `space-12: 24px` · `space-13: 25px` · `space-14: 30px` · `space-15: 40px` · `space-16: 50px` · `space-17: 60px` · `space-18: 80px` · `space-19: 100px`

## Shapes

**Border radius:** `radius-sm: 3px` · `radius-md: 4px` · `radius-lg: 8px` · `radius-xl: 10px` · `radius-full: 11px` · `radius-6: 20px` · `radius-7: 45px` · `radius-full: 50%` · `radius-9: 64px` · `radius-10: 100px` · `radius-11: 150px`

## Elevation

- **shadow-sm:** `rgb(0, 0, 0) 0px 0px 0px 1px inset`
- **shadow-md:** `rgba(0, 0, 0, 0.17) 0px 0.602187px 1.56569px -1.5px, rgba(0, 0, 0, 0.14) 0px 2.28853px 5.95019px -3px, rgba(0, 0, 0, 0.02) 0px 10px 26px -4.5px`

## Motion

- **duration-fast:** `all`
- **duration-fast:** `background, box-shadow`
- **duration-fast:** `none`
- **duration-slow:** `clip-path 1s cubic-bezier(0.65, 0, 0.2, 1), transform 1.3s cubic-bezier(0.2, 0.7, 0.2, 1)`

## Components

- **Buttons:** 3 detected
- **Links:** 32 detected
- **Inputs:** 14 detected
- **Navigation:** 4 elements
- **Lists:** 6 detected
- **Forms:** 1 detected
- **Images:** 98 detected

## Do's and Don'ts

### Do

- Reference tokens by name, not raw values — agents and developers should use `color.text.primary`, not `#171717`.
- Define all interactive states: default, hover, focus-visible, active, disabled.
- Use the spacing scale for all padding, margin, and gap values.
- Write content in sentence case. Reserve ALL CAPS for acronyms only.
- Test every component at the smallest and largest breakpoint before shipping.

### Don't

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not mix border-radius values. Pin to the detected set (3px, 4px, 8px, 10px, 11px, 20px, 45px, 50%, 64px, 100px, 150px).
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Writing Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or updating a component guideline for this system, follow this sequence:

1. **State the intent** — one sentence on what the component does and why it exists.
2. **Map tokens** — list every color, spacing, typography, and radius token the component uses. No raw values.
3. **Define anatomy** — break the component into named parts (container, label, icon, etc.) with their token assignments.
4. **Specify states** — document every state: default, hover, focus-visible, active, disabled, loading, error, empty.
5. **Describe interactions** — keyboard, pointer, and touch behavior, including edge cases (long content, overflow, truncation).
6. **Add accessibility criteria** — write testable pass/fail checks (e.g. "focus ring must be visible at 3:1 contrast").
7. **List anti-patterns** — concrete examples of misuse with a brief explanation of why each is wrong.
8. **Close with a QA checklist** — a mechanical list of verifiable items (see Definition of Done below).

## Required Output Structure

Every component guideline produced from this system must contain these sections, in order:

1. Overview — purpose, when to use, when not to use.
2. Tokens and foundations — all referenced tokens from the tables above.
3. Anatomy and variants — named parts, variant matrix, responsive behavior.
4. States and interactions — full state table, keyboard/pointer/touch behavior.
5. Accessibility — ARIA attributes, contrast requirements, focus management, screen reader behavior.
6. Content guidelines — copy length, tone, capitalisation, placeholder text rules.
7. Anti-patterns — explicit examples of what not to build, with reasoning.

## Component Requirements

Every component built against this system must:

- Reference only tokens defined in the tables above — no hardcoded hex, px, or font values.
- Define all interactive states: default, hover, focus-visible, active, disabled, loading, error.
- Specify responsive behavior at the smallest and largest supported breakpoint.
- Handle edge cases: empty state, overflow / truncation, maximum content length.
- Include keyboard navigation (Tab, Enter, Escape, Arrow keys where applicable).
- Document ARIA roles, labels, and live-region behavior where relevant.
- Include known page component density: - **Buttons:** 3 detected
- **Links:** 32 detected
- **Inputs:** 14 detected
- **Navigation:** 4 elements
- **Lists:** 6 detected
- **Forms:** 1 detected
- **Images:** 98 detected

## Definition of Done

A component is not complete until every item below is checked:

- Renders correctly in its default state (smoke test).
- All states documented and visually verified (hover, focus, disabled, loading, error, empty).
- All visual values use design tokens — zero hardcoded values.
- Keyboard navigation works without a pointer.
- No critical accessibility violations (contrast, ARIA, focus order).
- Tested at smallest and largest breakpoint.
- Anti-patterns section lists at least one concrete misuse example.
- Documentation covers purpose, usage, props/API, and limitations.
