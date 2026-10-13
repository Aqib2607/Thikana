# 12. Clean Up Dead Code

## Objective

Remove code that is proven unused without changing approved behavior.

## Scope

Review:

- Unused React components
- Unused hooks
- Unused utilities
- Unused exports
- Unreachable branches
- Commented-out implementation blocks
- Unused dependencies
- Stale feature flags
- Duplicate logic
- Dead CSS
- Unused assets
- Obsolete API code

## Required Safety Check

Before every deletion:

1. Search for imports.
2. Search for dynamic imports.
3. Search for string references.
4. Search for route references.
5. Check configuration references.
6. Check tests.
7. Confirm the item is genuinely unused.

## Rules

- Do not delete uncertain code.
- Record uncertain candidates.
- Do not remove code only because it looks old.
- Preserve behavior covered by the PRD and specification.
- Delete in small batches.
- Run build and relevant tests after each batch.

## Output

Report:

- Files removed
- Lines removed
- Dependencies removed
- Duplicate logic consolidated
- Items intentionally retained
- Items not safe to delete

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
