# 13. Write Clean Git Commits

## Branch

`agent/thikana`

## Commit Format

`agent: <summary_of_changes>`

## Rules

- Keep commits focused.
- Split unrelated changes.
- Use imperative language.
- Explain why when the change is non-obvious.
- Never commit secrets.
- Never commit `.env` files.
- Never commit generated build artifacts.
- Never mix broad refactoring with behavior changes.

## Examples

`agent: add tenant authentication`

`agent: implement property approval`

`agent: add property matching`

`agent: add tenant landlord messaging`

`agent: add property e2e tests`

## Commit Gate

Before committing:

1. Show changed files.
2. Show diff summary.
3. Check for secrets.
4. Check `.env` files.
5. Confirm tests relevant to the change.
6. Present commit plan.
7. Commit one logical group at a time.

## Sensitive Changes

Migration, dependency installation, deletion, destructive data operations, and production configuration changes require confirmation before execution.

## Forbidden

Do not commit:

- API keys
- Database passwords
- SMTP credentials
- Access tokens
- Private keys
- `.env`
- node_modules
- dist
- build output

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
