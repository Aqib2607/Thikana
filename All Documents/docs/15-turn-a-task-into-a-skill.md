# 15. Turn a Task Into a Skill

## Candidate Skill

Property Listing Review

## Trigger Phrases

Examples:

- "Review this property listing"
- "Check this listing before approval"
- "Validate this property"
- "Review the pending property"

## Purpose

Provide a repeatable admin workflow for reviewing a landlord property before approval.

## Workflow

1. Load the property.
2. Confirm the landlord is authorized to own/manage it.
3. Check required property fields.
4. Check location hierarchy.
5. Check rent and charge fields.
6. Check rooms, bathrooms, size, floor, and furnishing.
7. Check amenities.
8. Check availability.
9. Check image count.
10. Confirm maximum five images.
11. Confirm first image is featured.
12. Check image validity.
13. Review simulated verification states.
14. Check obvious duplicate or inconsistent listing data.
15. Produce a review summary.
16. If valid, prepare an approval action.
17. If invalid, identify exact corrections.
18. Do not approve automatically unless the approved workflow explicitly permits it.

## Ask the User When

Ask for clarification when:

- A required field's intended value is unclear.
- A verification decision requires information not available to the system.
- A destructive action is requested.
- The task would change the approved specification.
- The property data conflicts with project rules.

## Infer Automatically

The skill may infer:

- Whether image count exceeds five.
- Whether the first image can be treated as featured.
- Whether required fields are missing.
- Whether a listing is internally inconsistent.
- Which validation rule was violated.

## Done Means

- All required fields reviewed.
- Image constraints checked.
- Location checked.
- Availability checked.
- Verification state checked.
- Problems listed precisely.
- No unapproved destructive action performed.

## Dry Run

Before enabling the skill for autonomous execution, run it against a real academic sample property and compare the output with the manual review process.

## Other Candidate Skills

Future skills may cover:

- Property approval
- Security audit
- E2E workflow verification
- Release readiness

Only create these when they become repetitive tasks in the actual repository.

## Source Basis
This document is project-specific and follows the approved Thikana proposal and the 15-prompt methodology in Vibe Coding Preparation.pdf. Where the proposal does not define an implementation detail, this document preserves the approved academic-scope decision rather than inventing production requirements.
