# 08. Connect Your Database

## Database

MySQL.

## Hosting

Railway.

## Backend

Laravel + Eloquent.

## Connection

The backend connects to Railway MySQL through environment variables.

Required configuration names should follow Laravel conventions and be documented in `.env.example`.

Never commit real credentials.

## Core Schema

The database supports:

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

## Relationships

- A user has one role.
- A landlord owns many properties.
- A property has one location.
- A property has many images.
- A property has many amenities through a relation.
- A tenant has rental preferences.
- A tenant has many favorites.
- A tenant owns comparison sets.
- A property can have many contact requests.
- Authorized users participate in conversations.
- Conversations contain messages.
- Properties have visit requests.
- Properties have reviews.
- Properties have verification records.
- Areas contain community information.
- Properties can receive reports.
- Users receive notifications.
- Administrative actions produce audit logs.

## Index Strategy

Index fields used heavily for:

- property availability
- rent
- property type
- city
- area
- bedrooms
- bathrooms
- furnished status
- landlord_id
- created_at
- request status
- notification recipient
- report status

Composite indexes should only be introduced after query patterns are confirmed.

## Query Rules

- Use Eloquent relationships.
- Use typed API resources.
- Do not scatter raw SQL across controllers or frontend code.
- Keep search query logic in an appropriate backend query layer.
- Validate filters before querying.

## Migrations

Every migration must have a rollback path.

Migration order must respect foreign-key dependencies.

Before applying migrations to a shared or deployed database, obtain explicit confirmation.

## Seed Data

Seed only academic demonstration data.

Seed data must not contain real personal information or real credentials.

## Proof

After connection:

1. Run migrations.
2. Seed one demonstration property.
3. Read it through the API.
4. Confirm the frontend can consume the response.
5. Record the verification output.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
