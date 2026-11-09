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

### Property Discovery

**Given** an unauthenticated visitor requests the property listing endpoint,
**When** the request is valid,
**Then** the API returns approved properties and does not expose personalized matching information.

**Given** an active authenticated tenant requests the same endpoint,
**When** the tenant has applicable rental preferences,
**Then** the API returns approved properties with the applicable matching information.

**Given** an authenticated landlord requests the endpoint,
**When** the request is valid,
**Then** the API returns approved properties without tenant-specific matching information.

**Given** a suspended authenticated user requests public discovery,
**When** the middleware resolves the account,
**Then** the API returns HTTP 403 without modifying the user's personal access token.

#### Endpoint Specifications & Privacy Contracts

- `GET /api/v1/properties`: Public discovery via `OptionalSanctumAuth`. Returns `{"data": PropertyResource[], "total": int, "page": int, "limit": int, "totalPages": int, "areas": string[]}`.
- `GET /api/v1/properties/{idOrSlug}`: Public detail via `OptionalSanctumAuth`. Returns `{"data": PropertyResource}`. Landlord private phone/email redacted.
- `GET /api/v1/properties/{idOrSlug}/reviews`: Public reviews via `OptionalSanctumAuth`. Only approved reviews visible.
- `GET /api/v1/properties/areas`: Public metadata. Returns `{"data": string[]}` from `areas` table (11 areas).
- `GET /api/v1/properties/amenities`: Public metadata. Returns `{"data": AmenityItem[]}` from `amenities` table.
- Unauthenticated API failures return RFC JSON 401 `{"status": 401, "message": "auth.errors.unauthenticated"}` regardless of Accept header.

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
