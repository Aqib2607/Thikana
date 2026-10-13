# 05. Full UI & UX Design Brief

## Product Experience

Thikana should feel premium, modern, trustworthy, Bengali-first, responsive, and highly polished.

The interface should encourage discovery without sacrificing clarity.

## Design References

Use these for patterns and visual direction only:

- Motion Primitives: https://motion-primitives.com/
- Haikei: https://haikei.app/
- Realtime Colors: https://www.realtimecolors.com/
- 21st.dev: https://21st.dev/

Do not copy their designs.

## Brand

No existing logo exists.

Create a premium Thikana identity during implementation from an approved design direction.

The visual identity must work in:

- Light mode if selected
- Dark mode if selected
- Property cards
- Navigation
- Favicon
- Authentication screens
- Admin interface

## Primary Journey

Tenant:

Login → Search → Filter → Results → Map/List → Property Details → Match Breakdown → Favorite/Compare → Contact → Message → Visit → Review

Landlord:

Login → Dashboard → Create Property → Images → Location → Amenities → Submit → Admin Approval → Published → Contact → Message → Visit → Availability

Admin:

Login → Dashboard → Pending Listings → Review → Approve/Reject → Verification → Reports → Reviews → Community → Users → Analytics → Audit Logs

## Core Screens

### Public/Authentication

- Login
- Registration
- Email verification
- Password reset
- Authentication errors

### Tenant

- Home/Search
- Search results
- Property details
- Favorites
- Comparison
- Rental preferences
- Messages
- Visit requests
- Notifications
- Profile
- Reviews

### Landlord

- Dashboard
- Properties
- Create property
- Edit property
- Property details
- Contact requests
- Messages
- Visit requests
- Notifications
- Profile

### Admin

- Dashboard
- Property approvals
- Property moderation
- Users
- Verification
- Reports
- Reviews
- Community information
- Analytics
- Audit logs

## Homepage

Recommended hierarchy:

1. Hero with large rental search
2. Quick search controls
3. Featured properties
4. How Thikana works
5. Area exploration
6. Verified properties
7. Explainable matching
8. Community information
9. Primary CTA
10. Footer

The homepage must make the search workflow obvious immediately.

## Search Results

Use a list + map experience.

Desktop:

- Filters/sidebar
- Property cards
- Map panel

Mobile:

- Filter button/drawer
- Property cards
- Map toggle

Property cards should expose:

- Featured image
- Property title
- Location
- Rent
- Key attributes
- Availability
- Verification indicators
- Match score when applicable
- Favorite action
- Compare action

## Property Details

Hierarchy:

- Image gallery
- Property title
- Location/map
- Rent and charges
- Core specifications
- Amenities
- Availability
- Verification
- Match score
- Match breakdown
- Description
- Community information
- Landlord information
- Contact action
- Visit request
- Reviews
- Report action

## Dashboard

Avoid generic enterprise dashboard aesthetics.

Use role-specific summaries and clear next actions.

## Typography

Typography must support Bangla and English.

Use a modern sans-serif system with a compatible Bengali font fallback.

Exact font tokens are finalized during implementation after browser testing.

## Color System

Create semantic tokens:

- Background
- Surface
- Surface elevated
- Primary
- Primary foreground
- Secondary
- Accent
- Success
- Warning
- Error
- Muted
- Border

Use Realtime Colors for experimentation, then commit an accessible project-specific palette.

## Motion

Use motion for:

- Page transitions
- Property card hover
- Search interaction
- Filter open/close
- Dialog transitions
- Match score reveal
- Image gallery
- Toast/notification entrance
- Button feedback
- Scroll reveals

Avoid animation for:

- Critical error messages
- Essential reading content
- Long waits
- Repetitive distracting motion

Respect reduced-motion preferences.

## SVG and Backgrounds

Use Haikei-inspired techniques for:

- Blobs
- Waves
- Abstract shapes
- Section backgrounds

SVG backgrounds must not interfere with text contrast or interaction.

## Components

Core reusable components:

- Navbar
- Footer
- Search bar
- Filter panel
- Property card
- Property gallery
- Property map
- Match score
- Match breakdown
- Verification badge
- Availability badge
- Amenity list
- Favorite button
- Compare selector
- Contact request form
- Visit request form
- Message thread
- Notification item
- Review form
- Report dialog
- Data table
- Pagination
- Empty state
- Loading skeleton
- Error state
- Confirmation dialog
- Toast

## Responsive Breakpoints

Design mobile-first.

Required validation targets:

- Small mobile
- Large mobile
- Tablet
- Laptop
- Desktop
- Wide desktop

Do not allow the map, comparison table, filters, or messaging interface to overflow horizontally on small screens.

## Accessibility

Target WCAG 2.2 principles.

Required:

- Keyboard navigation
- Visible focus
- Accessible labels
- Semantic headings
- Form error association
- Adequate contrast
- Non-color-only status communication
- Accessible dialogs
- Accessible buttons
- Reduced-motion support
- Mobile touch targets
- Text alternatives for meaningful visuals

## Localization

Bangla is primary.

English is secondary.

Layouts must tolerate longer translated strings.

Do not use fixed-width text containers that break with Bangla or English content.

## Design Quality Gate

Before approval:

- Check all major states.
- Check mobile.
- Check keyboard navigation.
- Check reduced motion.
- Check Bangla text.
- Check English text.
- Check empty/error/loading states.
- Check visual consistency.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
