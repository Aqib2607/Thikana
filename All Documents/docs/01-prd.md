# 01. Full PRD

## Product

Thikana, a bilingual web-based rental property discovery and management platform.

## Product Goal

Help tenants in Bangladesh find and evaluate rental properties through structured search, filtering, explainable rule-based matching, comparison, favorites, communication, and property visits. Give landlords a structured workflow for publishing and managing properties. Give administrators control over approval, moderation, simulated verification, community information, and platform oversight.

## Users

### Tenant

Searches rental properties, saves preferences, receives matching scores, compares up to three properties, favorites listings, contacts landlords, messages landlords, requests visits, reviews properties, and reports properties.

### Landlord

Creates and manages property listings, uploads up to five images, provides structured property information, controls availability, responds to contact requests, communicates with tenants, and responds to visit requests.

### Administrator

Manages users, listings, approvals, simulated verification, reports, reviews, community information, analytics, notifications, and audit logs.

## Problem

Rental information in Bangladesh can be scattered across physical searches, advertisements, personal contacts, social media, and online sources. Tenants can struggle to compare properties, confirm availability, assess suitability, and communicate with landlords. Landlords need structured listing and inquiry management.

## Success Metrics

Academic success is measured by demonstrable completion of the core workflows:

- A tenant can authenticate and search properties.
- A tenant can filter and sort properties.
- A tenant can save rental preferences and receive an explainable match score.
- A tenant can compare up to three properties.
- A tenant can favorite a property.
- A tenant can contact and message a landlord.
- A tenant can request a visit and track its status.
- A tenant can review and report a property.
- A landlord can create, edit, deactivate, and manage a listing.
- A landlord can upload no more than five images, with the first as featured.
- An administrator can approve or reject listings.
- An administrator can manage simulated verification.
- The application supports Bangla and English.
- Protected workflows enforce role-based authorization.
- The deployed academic prototype passes the agreed test suite.

## Scope

### V1

- Authentication
- Tenant, landlord, admin roles
- Profiles
- Rental preferences
- Property CRUD
- Five-image limit
- Featured image
- Location hierarchy
- Leaflet map
- Amenities
- Availability states
- Search
- Filtering
- Sorting
- Rule-based matching
- Favorites
- Three-property comparison
- Contact requests
- API-based messaging
- Visit requests
- Simulated verification
- Reviews
- Community information
- Reports
- In-app notifications
- Audit logs
- Admin dashboard
- Bangla and English localization
- Responsive UI
- Testing
- Render and Railway deployment

### Out of Scope

- Payment gateways
- SMS gateways
- Government identity verification
- AI/ML matching
- Mobile applications
- Advanced routing
- Large-scale infrastructure
- Production-grade billing
- Complex real-time messaging
- Unapproved external automation

## Core User Stories

### Authentication

As a tenant, I want to register and log in using my email or phone number and password so that I can use protected rental features.

Acceptance:
- Registration validates required fields.
- Login accepts email or phone identifier.
- Password is mandatory.
- Protected routes reject unauthenticated access.
- Role authorization prevents cross-role access.

### Property Discovery

As a tenant, I want to search and filter properties so that I can find suitable rentals.

Acceptance:
- Search supports location, property type, title, and description.
- Filters include rent, rooms, bathrooms, amenities, furnished status, and availability.
- Sorting includes relevance, newest, lowest rent, and highest rent.
- Results support list and map presentation.

### Matching

As a tenant, I want to save rental preferences and see an explainable match score.

Acceptance:
- Preferences are persisted.
- Matching uses fixed weights.
- Score totals 100%.
- Score breakdown is visible.
- Matching does not use AI/ML.

### Comparison

As a tenant, I want to compare up to three properties.

Acceptance:
- Only authenticated users can compare.
- Maximum three properties can be selected.
- Comparison includes approved property attributes and match score.
- The UI prevents adding a fourth property.

### Landlord Listing

As a landlord, I want to publish structured property information.

Acceptance:
- Landlord can create and edit owned listings.
- Maximum five images.
- First image is featured.
- Availability can be updated.
- Listing is submitted for admin approval.
- Landlord cannot modify another landlord's listing.

### Communication

As a tenant, I want to contact a landlord before messaging.

Acceptance:
- Tenant can send a contact request.
- Landlord can respond.
- Messaging becomes available after the approved interaction state.
- Messages remain private to authorized participants.

### Visit

As a tenant, I want to request a property visit.

Acceptance:
- Tenant supplies preferred date and time.
- Landlord accepts or rejects.
- Status supports Pending, Accepted, Rejected, Cancelled, Completed.
- Unauthorized users cannot manipulate another user's request.

### Reviews

As a logged-in tenant, I want to review a property.

Acceptance:
- Logged-in tenants may submit reviews.
- Completed visits can produce a Visited indicator.
- Review contains overall rating/text and detailed approved criteria.
- Admin can moderate reviews.

### Reporting

As a user, I want to report problematic properties.

Acceptance:
- Report reasons are structured.
- Other includes a description.
- Admin can review reports.
- Report actions are auditable.

## Property Availability

- Available
- Reserved
- Rented
- Temporarily Unavailable
- Internal inactive state for deactivated listings

## Data Model Changes

Core entities:

- users
- roles
- properties
- property_images
- property_locations
- amenities
- property_amenities
- rental_preferences
- favorites
- comparisons
- comparison_items
- contact_requests
- visit_requests
- conversations
- conversation_participants
- messages
- property_verifications
- reviews
- areas
- community_information
- property_reports
- report_reasons
- notifications
- audit_logs

Exact fields and migration order belong in the approved implementation plan and specification.

## Edge Cases

- Duplicate property submission
- More than five images
- Missing featured image
- Deleted image referenced as featured
- Property becomes rented after tenant favorites it
- Property becomes unavailable during comparison
- Contact request sent to an inactive listing
- Unauthorized property modification
- Unauthorized message access
- Visit request for a non-available property
- Duplicate review
- Report against a deactivated property
- Rejected property resubmission
- Missing translation key
- Map/geocoding failure
- Invalid uploaded image
- Expired or invalid authentication session

## Failure States

Every major UI flow must define loading, empty, error, success, and permission-denied states.

## Open Questions

None required for the approved academic scope. Implementation-level unknowns must be explicitly recorded rather than invented.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
