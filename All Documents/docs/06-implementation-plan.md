# 06. Implementation Plan

## Objective

Build Thikana in an ordered sequence where each step can be verified independently.

The sequence follows the proposal's six development phases while keeping the repository buildable after each implementation increment.

## Phase 1: Foundation and Authentication

### Step 1. Repository Initialization
Size: S

Files:
- Repository configuration
- Frontend package configuration
- Backend Laravel configuration
- Environment examples

Verify:
- Frontend installs and starts.
- Backend starts.
- Environment configuration is documented.

### Step 2. Base UI System
Size: M

Implement:
- Tailwind
- shadcn/ui
- Lucide
- Layout primitives
- Typography tokens
- Color tokens

Verify:
- Sample route renders.
- Responsive layout works.

### Step 3. Laravel API Foundation
Size: M

Implement:
- API structure
- Models
- Form Requests
- API resources
- Error format

Verify:
- Health endpoint works.
- Tests execute.

### Step 4. Authentication
Size: L

Implement:
- Tenant registration
- Landlord registration
- Login using email or phone
- Password
- Sanctum
- Email verification
- Logout
- Protected routes
- Role authorization

Verify:
- Valid login works.
- Invalid login fails.
- Unauthenticated access is blocked.
- Cross-role access is blocked.

## Phase 2: Dashboards

### Step 5. Role Dashboards
Size: M

Implement:
- Tenant dashboard
- Landlord dashboard
- Admin dashboard

Verify:
- Correct role receives correct dashboard.
- Unauthorized dashboard access fails.

## Phase 3: Property Management

### Step 6. Database Schema
Size: L

Implement core tables and relationships.

Verify:
- Migrations run.
- Rollbacks work.
- Foreign keys work.
- Indexes exist for major queries.

### Step 7. Property CRUD
Size: L

Implement landlord-owned property CRUD.

Verify:
- Create.
- Read.
- Update.
- Deactivate.
- Authorization.

### Step 8. Images
Size: M

Implement:
- Five-image limit
- Featured image
- Upload validation
- Delete/replace workflow

Verify:
- Sixth image is rejected.
- First image becomes featured.
- Invalid upload is rejected.

### Step 9. Locations and Amenities
Size: M

Implement:
- Division
- District
- City
- Area
- Address
- Coordinates
- Amenities

Verify:
- Structured location saves.
- Map displays property.
- Missing location is handled.

### Step 10. Approval
Size: M

Implement:
- Submit
- Pending
- Approve
- Reject
- Resubmit

Verify:
- Only approved listings become publicly available.
- Admin authorization is enforced.

## Phase 4: Discovery and Interaction

### Step 11. Search and Filters
Size: L

Implement:
- Search
- Filters
- Sorting
- Pagination
- List/map

Verify:
- Every filter changes results correctly.
- Pagination remains correct.
- Empty state works.

### Step 12. Matching
Size: M

Implement fixed weighting.

Verify:
- Total score is deterministic.
- Breakdown equals total.
- No AI/ML dependency.

### Step 13. Favorites and Comparison
Size: M

Implement:
- Favorites
- Comparison
- Maximum three

Verify:
- Unauthenticated requests fail.
- Fourth comparison is rejected.
- Removed property is handled.

### Step 14. Contact and Messaging
Size: L

Implement:
- Contact request
- Response
- Conversation
- Messages
- Authorized participants

Verify:
- Unauthorized users cannot read messages.
- Contact state controls messaging.

### Step 15. Visit Requests
Size: M

Implement:
- Request
- Accept
- Reject
- Cancel
- Complete

Verify:
- Invalid transitions fail.
- Notifications are generated.

### Step 16. Verification
Size: M

Implement simulated verification states.

Verify:
- Admin controls verification.
- Public UI clearly describes simulation.

### Step 17. Reviews and Reports
Size: M

Implement:
- Reviews
- Detailed criteria
- Visited indicator
- Reports
- Admin moderation

Verify:
- Logged-in tenant review works.
- Report reasons validate.

### Step 18. Community Information
Size: M

Implement admin-managed area information.

Verify:
- Area information displays on relevant property/location pages.

### Step 19. Notifications
Size: M

Implement in-app notifications.

Verify:
- Relevant events generate notifications.
- Read/unread state works.

## Phase 5: QA

### Step 20. Unit and Component Tests
Size: M

Test:
- Matching
- Validation
- Components
- State transitions

### Step 21. API and Authorization Tests
Size: L

Test:
- Authentication
- Authorization
- CRUD
- Contact
- Messaging
- Visits
- Reviews
- Reports
- Admin

### Step 22. E2E
Size: L

Test:
- Tenant workflow
- Landlord workflow
- Admin workflow

### Step 23. Security Audit
Size: M

Check:
- Secrets
- IDOR
- Injection
- XSS
- uploads
- authorization
- rate limiting
- dependency audit

## Phase 6: Deployment

### Step 24. Deployment Configuration
Size: M

Target:

- Frontend: Render
- Backend: Render
- MySQL: Railway

Verify:
- Environment variables are configured.
- CORS is correct.
- Sanctum works.
- Database connection works.

### Step 25. Final Validation
Size: M

Run:

- Lint
- Typecheck
- Tests
- Build
- E2E
- Security checks

Then perform final responsive and bilingual QA.

## Risk Ordering

Highest-risk areas should be validated early:

1. Authentication and Sanctum
2. Authorization
3. Database relationships
4. Property image handling
5. Search query design
6. Matching calculation
7. Messaging authorization
8. Deployment/CORS
9. Map integration
10. Visual polish

## Migration Rule

Any database migration requires explicit confirmation before execution in a controlled implementation cycle.

## File Change Rule

Do not modify more than 20 files in one implementation cycle.

Never modify:

- node_modules
- .git
- dist
- build

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
