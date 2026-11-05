# Product reviews delivery plan (v0.3.0)

Status: Complete. All 8 stages of the reviews delivery workflow are finished, verified across unit, PostgreSQL integration, and Playwright browser suites, and audited in the final review pass. Ready for human sign-off. See the development log for verification and findings.

## Workflow Stages

- [x] 1. Behavioral analysis and scope — interactive exploration of the exact behavior with the LLM to build the spec
- [x] 2. Architectural constraints — technical architecture, data model, validation, and PIM re-import preservation
- [x] 3. Tests — LLM builds the test suite from the behavioral and architectural spec
- [x] 4. Test review and hardening — an adversarial pass reviews, identifies gaps, and directly hardens the tests
- [x] 5. Coding — LLM implements the feature to pass the hardened test suite while adhering to the architectural spec
- [x] 6. Coding review & direct refinement — an adversarial pass reviews against architectural spec and directly resolves issues
- [x] 7. Human taste test & iterative tuning — human tests the live app and LLM addresses feedback in a tight loop until satisfied
- [x] 8. Final adversarial audit & polish — final adversarial check for gaps/edge cases, direct fixes, and sanity check by human

---

## Phase 1 Agreed Behavioral Specification

### 1. Presentation & Scope
- **Review Reading on Product Details (`/products/:id`)**:
  - Summary card showing aggregate rating: average score (e.g. `4.3`), 5 stars visual representation, total count (e.g. `(14 reviews)`), and a primary "Write a review" action button.
  - When 0 reviews exist: Empty state card ("No customer reviews yet. Be the first to share your experience with this product.") with the "Write a review" button.
  - Reviews list uses the **same infinite-scroll / "Load more" mechanism as the catalogue** (IntersectionObserver sentinel + fallback "Load more" button, batch-loaded).
  - If reviews fail to load, keep product details usable, show an error and Retry in the reviews section, and allow opening the review form.
  - If loading a subsequent batch fails, retain the reviews already displayed, show an error near the list, and allow retrying that batch.
  - Ordering: strictly newest first (`createdAt DESC`).
  - Available on all products regardless of status (active or unavailable), including products absent from the latest import: existing reviews remain visible and new reviews can be submitted.
- **Write Form Presentation**:
  - Modal / Dialog presentation: centered modal on desktop, full-screen overlay/sheet on mobile with `← Back to product` header, matching the visual direction in `docs/agent/reviews/references/mobile-review-page.png`.
  - Closing / dismissing returns focus to the "Write a review" trigger button.
  - If a rating, name, or comment has been entered, ask for confirmation: "Keep editing" preserves the draft and returns to the form; "Discard review" clears it and closes the form. Closing a blank form requires no confirmation.

### 2. Form Inputs & Validation
- **Rating**: Required integer between `1` and `5` stars (interactive star picker). If submitted with 0 stars selected, an inline error appears: *"Please select a rating between 1 and 5 stars"*.
- **Reviewer name**: Optional text input (placeholder e.g. "Alex M.", max 100 characters). Stored as null/empty and rendered as "Anonymous customer" if omitted.
- **Comment / experience**: Optional textarea (max 1,000 characters).
- If submission fails, keep the dialog open with the rating, name, and comment intact, show an error, and allow retry. A retry of the same submission uses a unique submission ID so it creates at most one review, including when the server saved it but the response was lost. After an uncertain failure, the customer may edit and resubmit; an edited submission can create a duplicate if the original was saved.
- Form submission disables inputs while in-flight, displays success notification ("Thank you! Your review has been submitted"), closes the modal, and refreshes the review list and aggregate rating with the new review at the top.

### 3. Out of Scope for v0.3.0
- Content moderation, profanity filtering, report/flag mechanisms, and staff approval (reviews publish immediately upon submission).
- User authentication, verified purchase badges, or review editing/deletion.
- Rating-based sorting or filtering of reviews.
