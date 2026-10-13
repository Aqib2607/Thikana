# 10. Debug an Error Fast

## Rule

Do not guess.

Use evidence from the stack trace, repository, logs, tests, and runtime behavior.

## Workflow

### 1. Capture

Collect:

- Full error
- Stack trace
- Request
- Browser console output
- Backend logs
- Reproduction steps
- Environment

### 2. Locate

Open the exact files referenced by the stack trace.

Trace the execution path to the root cause.

### 3. Expected vs Actual

State in one line:

Expected: ...

Actual: ...

### 4. Hypotheses

Create three hypotheses ranked by likelihood.

Each hypothesis must identify evidence that would prove or disprove it.

### 5. Prove

Use:

- Logs
- Focused test
- API request
- Database inspection
- Browser reproduction
- Minimal reproduction

Do not change code before establishing the cause unless the evidence already identifies it.

### 6. Fix Root Cause

Do not patch only the visible symptom.

### 7. Repository Search

Search for the same pattern elsewhere.

If the same defect pattern exists in another module, identify it.

### 8. Regression Test

Add a test that fails before the fix and passes after it.

### 9. Verification

Run the smallest relevant verification first, then the broader suite.

### 10. Report

Explain in two lines:

- Why it broke.
- Why the regression test prevents the same failure.

## Sensitive Debugging

Require approval before changing:

- Authentication
- Authorization
- Database schema
- Production configuration
- Data deletion

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
