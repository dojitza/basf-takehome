# Product reviews delivery plan (v0.3.0)

Status: Bootstrapping Phase 1 (Behavioral analysis and scope).

## Workflow Stages

- [ ] 1. Behavioral analysis and scope — interactive exploration of the exact behavior with the LLM to build the spec
- [ ] 2. Architectural constraints — technical architecture, data model, validation, and PIM re-import preservation
- [ ] 3. Tests — LLM builds the test suite from the behavioral and architectural spec
- [ ] 4. Test review and hardening — an adversarial pass reviews, identifies gaps, and directly hardens the tests
- [ ] 5. Coding — LLM implements the feature to pass the hardened test suite while adhering to the architectural spec
- [ ] 6. Coding review & direct refinement — an adversarial pass reviews against architectural spec and directly resolves issues
- [ ] 7. Human taste test & iterative tuning — human tests the live app and LLM addresses feedback in a tight loop until satisfied
- [ ] 8. Final adversarial audit & polish — final adversarial check for gaps/edge cases, direct fixes, and sanity check by human

## Key Objectives & Scope Candidates

- Review data model (`Review`: id, productId, rating 1–5, reviewerName, comment, createdAt).
- PIM Seed Preservation: reviews must survive repeated PIM CSV imports.
- Read path: display aggregate rating and list of reviews on Product Details view.
- Write path: submit a review with validation and error/feedback handling.
- Direct review anchors/linking if applicable.
