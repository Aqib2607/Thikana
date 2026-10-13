# 03. Ultra Plan Mode

## Purpose

Plan changes before implementation. No file writes occur during planning.

## Required Input

- Task
- Relevant PRD requirement
- Approved specification
- Constraints
- Protected areas
- Existing repository state

## Required Workflow

### 1. Analyze Files

Read every file the task touches.

For each file provide:

- Path
- Current responsibility
- Relevant current behavior

### 2. Current vs Target

Document:

- Current behavior
- Target behavior
- Exact behavioral difference
- API impact
- Database impact
- UI impact

### 3. Approaches

Propose 2 to 3 viable approaches.

For each:

- Complexity
- Risk
- Blast radius
- Maintainability
- Academic-scope fit

### 4. Selection

Select one approach only after comparing the alternatives.

Justify the selection in three concise lines.

### 5. Verifiable Steps

Break implementation into small steps.

Each step must contain:

- Files
- Change
- Dependency
- Verification
- Expected result

### 6. Risks and Rollback

For each risk specify:

- Trigger
- Impact
- Detection
- Exact rollback

### 7. Sensitive Areas

Explicitly flag:

- Authentication
- Authorization
- Database migrations
- Data deletion
- Deployment configuration
- Secrets
- Public/private contact visibility
- Verification semantics
- Matching logic

Sensitive changes require explicit approval.

## Execution Gate

After presenting the plan:

STOP.

Do not modify files until the user approves the plan.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
