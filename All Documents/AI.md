# Thikana AI.md

## Project

Thikana is a bilingual, academic rental property discovery and management web application for Bangladesh. It helps tenants search, match, compare, save, contact, and arrange visits for rental properties while landlords manage listings and tenant interactions.

## Stack

- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- UI: shadcn/ui
- Icons: Lucide React
- Server state: TanStack Query
- Forms: React Hook Form + Zod
- Localization: i18next + react-i18next
- Maps: Leaflet + OpenStreetMap-compatible data
- Backend: Laravel REST API + PHP
- Authentication: Laravel Sanctum
- ORM: Laravel Eloquent
- Database: MySQL
- Hosting: Render frontend, Render backend, Railway MySQL
- Testing: Vitest, React Testing Library, PHPUnit/Pest
- Development: Windows + Antigravity IDE
- Repository: new Git repository

## Repository Rules

- Keep frontend and backend concerns separate.
- Keep API contracts explicit.
- Keep server state in TanStack Query.
- Keep local UI state in the chosen local state layer.
- Use React Hook Form and Zod for frontend forms.
- Use Laravel Form Requests for backend validation.
- Use Eloquent relationships instead of scattered raw SQL.
- Use translation keys for user-facing text.
- Never hardcode secrets.
- Store secrets in environment variables.
- Do not expose private user data through public property endpoints.
- Enforce authorization on every protected resource.
- Keep admin-only operations behind explicit authorization.
- Validate uploaded property images on the backend.
- Preserve the five-image maximum per property.
- Treat the first uploaded image as the featured image.
- Keep the rule-based matching weights fixed to the approved specification.
- Do not introduce AI or machine learning into the matching system.
- Keep the academic scope small and demonstrable.

## Roles

- Tenant
- Landlord
- Administrator

Administrators are not publicly registered through normal registration.

## Core Modules

- Authentication and authorization
- Tenant profile and rental preferences
- Landlord profile
- Property CRUD
- Property images
- Property location
- Amenities
- Property approval
- Search and discovery
- Rule-based matching
- Favorites
- Three-property comparison
- Contact requests
- Internal messaging
- Property visits
- Simulated verification
- Reviews
- Community information
- Property reports
- Notifications
- Audit logs
- Localization
- Admin dashboard and moderation

## Matching Rules

Use the approved fixed weighting:

- Location: 30%
- Budget: 25%
- Property type: 15%
- Rooms and bathrooms: 10%
- Amenities: 15%
- Availability: 5%

Display the total percentage and an explainable breakdown.

## Property Rules

Maximum images: 5.

The first image is the featured image.

Public availability states:

- Available
- Reserved
- Rented
- Temporarily Unavailable

An internal inactive state may be used for deactivated listings.

## Authentication

Login supports email or phone number plus mandatory password.

Tenant and landlord registration are public.

Admin registration is not public.

Email verification should use Laravel's normal email verification flow where the deployment can provide email delivery. Phone verification should remain academic/simulated unless a genuinely free, approved method is available.

## Communication

Tenant sends a contact request first.

Messaging becomes available after the appropriate interaction state.

Messaging is API-based for the academic version. Do not introduce WebSockets, Redis, or other real-time infrastructure unless explicitly approved.

Landlords may choose whether their contact details are publicly displayed.

## Verification

Verification is platform-level simulated verification.

Do not describe it as government certification.

Verification states:

- Owner Identity Verified
- Phone Verified
- Availability Verified
- Documents Verified

Do not require sensitive identity-document storage unless explicitly approved.

## Reviews

Any logged-in tenant may review a property.

A completed visit can be used as a "Visited" indicator for the review.

Review structure includes the overall rating/text plus the approved detailed criteria.

## Localization

Bangla is primary.

English is secondary.

Do not hardcode user-facing strings when they belong in translation resources.

## Design Direction

The product should feel premium, modern, Bengali-first, responsive, and highly polished.

Approved visual references:

- Motion Primitives
- Haikei
- Realtime Colors
- 21st.dev

Use these as inspiration only. Do not copy designs.

Use gradients, SVG backgrounds, blobs, waves, motion, micro-interactions, and page transitions where they improve the interface.

Do not allow animation to reduce usability, accessibility, or performance.

## Academic Scope

Do not add:

- Payment gateways
- SMS gateways
- Government identity verification
- AI/ML matching
- Mobile applications
- Advanced routing
- Large-scale infrastructure
- Microservices
- Kubernetes
- Complex real-time infrastructure
- Production-scale billing systems

## Protected Areas

Require explicit approval before changing:

- Authentication behavior
- Authorization rules
- Database migrations
- Existing production/deployment configuration
- Verification semantics
- Matching weights
- Data deletion logic
- Public/private contact visibility behavior

## Verification Commands

The exact package manager and repository commands must be detected from the repository before use.

At minimum, verify applicable:

- Development server
- Production build
- Lint
- Typecheck
- Unit/component tests
- Backend tests
- API tests
- E2E tests

Do not invent commands that are not supported by the repository.

## Gotchas

- The project is academic, even though it is hosted online.
- Railway hosts MySQL. Render hosts frontend and backend.
- Public property pages require authentication according to the approved project requirement. Do not expose property discovery anonymously.
- Comparison is limited to three properties.
- Matching is rule-based, not AI-based.
- Verification is simulated.
- The first property image is the featured image.
- Notifications are in-app only.
- Phone verification should not silently become a paid SMS dependency.
- Exact property address is public.
- Search results should support both list and map views.
