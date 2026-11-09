# Architecture Decision Records (ADR) Repository

## ADR-01: Baseline Architectural Patterns & Authenticated Discovery (Historical)

**Status:** Accepted (Partially superseded by ADR-01.1)  
**Date:** 13 October 2026  
**Context:**  
Initial architecture defined Monolithic Laravel 13 backend with React 19 frontend served through TanStack Start / Vite, using Sanctum for API token authentication. Under initial specifications, property search and discovery were classified as protected tenant features residing under mandatory `auth:sanctum` middleware.

**Decision:**  
All core interaction and discovery endpoints placed behind `auth:sanctum`. Unauthenticated requests rejected with HTTP 401.

**Consequences:**  
High security perimeter, but prevented anonymous guests from viewing property listings in Khulna without first creating an account.

---

## ADR-01.1: Public Property Discovery with Optional Sanctum Authentication

**Status:** Accepted (Supersedes ADR-01 discovery access policy only)  
**Date:** 8 November 2026  
**Decision Maker:** Product Owner  

### 1. Context

Thikana previously placed property discovery endpoints under mandatory Sanctum authentication, preventing unauthenticated visitors from browsing property listings or details.

The product decision is to allow visitors to discover approved rental properties before registering or signing in. Authentication remains mandatory for personalized tenant functionality and protected operations.

The existing implementation also contained inconsistencies between database catalogs and frontend static data (such as a 10-area canonical list vs. the database's 11 areas).

This decision establishes the intended public discovery policy while preserving existing authentication boundaries.

### 2. Decision

Thikana supports public property discovery through optional Sanctum authentication.

The following endpoints support anonymous and authenticated requests:

- `GET /api/v1/properties`
- `GET /api/v1/properties/{idOrSlug}`
- `GET /api/v1/properties/{idOrSlug}/reviews`
- `GET /api/v1/properties/areas`
- `GET /api/v1/properties/amenities`

The property listing, detail, and review endpoints use optional authentication. The areas and amenities endpoints remain public metadata endpoints.

The optional authentication middleware (`OptionalSanctumAuth`) uses Laravel Sanctum's native guard (`Auth::guard('sanctum')->user()`). It supports bearer-token authentication and stateful session authentication.

It does not manually parse or validate personal access tokens. It does not revoke, delete, or modify tokens during read-only discovery requests.

### 3. Access Policy

| Capability | Guest | Tenant | Landlord | Admin |
| --- | --- | --- | --- | --- |
| Browse approved properties | Allowed | Allowed | Allowed | Allowed |
| View approved property details | Allowed | Allowed | Allowed | Allowed |
| View public reviews | Allowed | Allowed | Allowed | Allowed |
| View areas and amenities | Allowed | Allowed | Allowed | Allowed |
| Receive personalized tenant matching | No | Yes, when preferences exist | No | No |
| Manage favorites | No | Allowed | No | No |
| Manage comparisons | No | Allowed | No | No |
| Submit contact requests | No | Allowed | No | No |
| Manage landlord properties | No | No | Allowed | No |
| Access administration operations | No | No | No | Allowed |

Existing route-specific role and active-account middleware remain in place for protected operations. This decision does not expand permissions for any protected endpoint.

### 4. Property Visibility and Data Privacy

- Public discovery returns approved properties only (`status = 'approved'`).
- Pending, rejected, suspended, or draft properties do not appear in public listings.
- Public responses never expose sensitive landlord information (private phone numbers, private emails, identity docs).
- Reviews follow existing approval policies; anonymous review authors remain pseudonymous.
- Tenant matching (`matchBreakdown`) is personalized data:
  - Guest: `matchBreakdown` is null.
  - Active tenant with applicable preferences: matching information populated.
  - Landlord: `matchBreakdown` is null.
  - Admin: `matchBreakdown` is null.

### 5. Authentication and Account Status

1. A valid active bearer-token user is authenticated.
2. A valid supported stateful session user is authenticated.
3. An invalid, expired, or revoked bearer token does not grant authenticated access and safely defaults to guest.
4. An unauthenticated visitor continues as a guest.
5. A suspended authenticated user receives HTTP 403.
6. A read-only discovery request does not revoke or delete the suspended user's token.
7. Account-status enforcement remains consistent with the existing account-status model.
8. The middleware binds the resolved user to the request via `$request->setUserResolver()` and `Auth::setUser($user)`.

### 6. API Response and Error Behavior

API authentication failures return JSON HTTP 401 responses, including when the request does not send an `Accept: application/json` header:

```json
{
  "status": 401,
  "message": "auth.errors.unauthenticated"
}
```

Suspended accounts receive HTTP 403. Normal browser navigation and SPA gateway behavior remain functional.

### 7. Database Catalog Authority

The database is the authoritative source for areas and amenities.

- The `areas` endpoint retrieves records from the `areas` table (11 areas).
- The `amenities` endpoint retrieves records from the `amenities` table.
- Frontend forms and filters do not silently substitute hardcoded business catalogs when database requests fail; explicit loading, error, and retry states are displayed.

### 8. Consequences

- **Positive:** Visitors discover available properties without registration; tenant registration occurs after interest; catalogs match database ground truth; personalized matching and private landlord PII remain protected.
- **Trade-offs:** Requires dual-mode discovery testing; public listing endpoints require strict validation and existing rate-limiting protections.
