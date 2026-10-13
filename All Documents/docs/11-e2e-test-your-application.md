# 11. E2E Test Your Application

## Tool

Playwright.

## Objective

Test complete user-visible workflows rather than implementation details.

## Primary Flows

### Tenant

1. Register
2. Verify email where configured
3. Login
4. Search
5. Filter
6. Open property
7. View match score
8. Favorite
9. Compare up to three
10. Contact landlord
11. Message
12. Request visit
13. Complete visit
14. Review
15. Report

### Landlord

1. Register
2. Login
3. Create property
4. Upload five images
5. Set featured image
6. Set location
7. Add amenities
8. Submit
9. Observe pending state
10. Respond to contact
11. Message
12. Respond to visit
13. Update availability

### Admin

1. Login
2. View pending property
3. Approve/reject
4. Manage verification
5. Review report
6. Moderate review
7. Manage community information
8. View audit log

## Test Rules

- Test user-visible behavior.
- Prefer roles and labels for selectors.
- Avoid brittle CSS chains.
- Keep tests independent.
- Each test seeds its own required state.
- Do not share mutable state between tests.
- Test at least one unhappy path per major flow.
- Run headless in CI.
- Run headed locally for debugging.
- Capture screenshots and traces on failure.

## Important Negative Cases

- Invalid login
- Unauthorized dashboard access
- Unauthorized property modification
- Sixth image upload
- Invalid property data
- Fourth comparison
- Unauthorized message access
- Invalid visit transition
- Duplicate/invalid review
- Invalid report
- Expired authentication
- API/network failure

## Coverage Boundary

E2E does not replace unit or API tests.

Matching calculation, validation rules, authorization and data integrity should also have lower-level tests.

## Completion Criteria

Run the suite.

Fix failures.

Report:

- Tests passed
- Tests failed
- Tests skipped
- Remaining uncovered workflows

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
