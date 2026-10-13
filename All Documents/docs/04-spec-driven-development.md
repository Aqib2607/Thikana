# 04. Spec-Driven Development

## Principle

The specification is the source of truth. Code must implement the approved specification.

If implementation reality requires a deviation, stop, update the specification, and obtain approval before continuing.

## Specification Format

### Behavior

Every behavior uses:

Given
When
Then

Cover:

- Happy path
- Validation failure
- Authorization failure
- Empty state
- Not-found state
- Conflict state
- Server failure
- Boundary conditions

### API Contract

For every endpoint define:

- Method
- Route
- Authentication requirement
- Role requirement
- Inputs
- Validation
- Success response
- Error response
- Status codes
- Authorization rules

### Data

Define:

- Tables
- Columns
- Types
- Foreign keys
- Unique constraints
- Indexes
- Migration order
- Rollback behavior

### UI States

Every major screen must define:

- Loading
- Empty
- Error
- Success
- Unauthorized
- Forbidden
- Validation error

### Non-goals

Specifications must explicitly exclude:

- Payment
- SMS
- Government KYC
- AI/ML matching
- Mobile apps
- Advanced routing
- Large-scale infrastructure
- Unapproved real-time infrastructure

## Core Specifications

### Property Search

Given an authenticated user with valid search input,
when the user submits a search,
then the API returns authorized property results matching the supported filters and sorting rules.

### Matching

Given saved rental preferences,
when matching is requested,
then the system calculates a deterministic score using:

Location 30%
Budget 25%
Property type 15%
Rooms and bathrooms 10%
Amenities 15%
Availability 5%

### Comparison

Given an authenticated user,
when three or fewer properties are selected,
then the system creates or updates the user's comparison set.

When a fourth property is selected,
then the system rejects the operation with a clear user-facing explanation.

### Listing Approval

Given a landlord submits a valid listing,
when the listing enters the approval workflow,
then an administrator can approve or reject it.

A rejected listing can be corrected and resubmitted according to the approved workflow.

## Acceptance Checklist

- Behavior is specified.
- API contract is specified.
- Data changes are specified.
- UI states are specified.
- Non-goals are specified.
- Authorization is specified.
- Validation is specified.
- Error states are specified.
- Tests map to acceptance criteria.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
