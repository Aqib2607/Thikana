# 14. Hooks as Guardrails

## Objective

Use development hooks to reduce accidental regressions and unsafe agent actions.

## Pre-Tool Guardrails

Block or require explicit approval for:

- Database migrations
- Production configuration
- `.env` changes
- Destructive data operations
- File deletion
- Dependency installation

Protected paths must be project-specific after repository inspection.

## Post-Tool Verification

After relevant file edits, run applicable:

- Lint
- Typecheck
- Focused tests

Do not run expensive full suites after every trivial edit if the repository's actual runtime makes that impractical. Use the smallest meaningful verification.

## Stop Hook

Before a session ends:

- Run relevant tests.
- Check build status.
- Check git diff.
- Check secret exposure.
- Report unresolved failures.

## Notification

No external notification integration is required for v1.

Antigravity should stop and request user input whenever explicit approval is required.

## Safety Rules

Never allow hooks to:

- Delete data automatically
- Modify production databases automatically
- Commit secrets
- Bypass tests
- Bypass authorization
- Disable security checks silently

## Verification

Each configured guardrail should be deliberately triggered during setup to prove that it works.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
