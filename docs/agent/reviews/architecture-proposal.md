# Product reviews architecture proposal

Status: proposed for discussion; cursor pagination agreed. Not implemented or verified. Behavioral agreements and workflow are in [the reviews plan](reviews-plan.md).

## Data and import

Add a Review table with UUID id, productId foreign key, rating (integer 1–5), nullable reviewerName (up to 100 characters) and comment (up to 1,000 characters), createdAt, and a unique client-generated submissionId. Index productId, createdAt and id for ordered retrieval. Enforce the rating range in PostgreSQL as well as the API. A review belongs to one retained product; no import operation updates or deletes reviews. Re-import and absence marking preserve product identity and reviews. No moderation, authentication or editing/deletion is included.

## API

Proposed endpoints under the existing /api prefix:

- `GET /products/:id/reviews`: return a batch (default 10, maximum 100), a continuation cursor or null, and an aggregate count and average over all reviews for the product. Empty aggregate: count 0, average null. Order by createdAt descending, then id descending to break timestamp ties. The human agreed to a cursor based on both values to avoid offset shifts when a new review arrives. Calculate the aggregate from reviews on every request, as agreed; it describes current data at request time and is not a frozen snapshot across pages. Measure performance at representative review volumes later and consider optimization if needed ([TODO](../../../TODO.md)).
- `POST /products/:id/reviews`: accept submissionId, rating, optional reviewerName and optional comment; return the saved review. As agreed, trim optional text, normalize whitespace-only values to null, and validate types, integer rating from 1 to 5, and trimmed lengths (name at most 100 characters; comment at most 1,000) server-side, reject unknown or invalid input, and return 404 for an invalid or missing product. Product availability does not block either endpoint.

As agreed, a browser-generated UUID submissionId, enforced as unique by the database, protects against concurrent and repeated identical requests: replaying the same ID with the same product and normalized content returns the existing review; reusing it with different content or a different product returns a conflict. A newly edited submission gets a new ID. In a lost-response case this can create a duplicate, an accepted simplicity trade-off documented in [DECISIONS.md](../../../DECISIONS.md). Database errors return a generic server error without internal details. Precise HTTP status and response shapes should be settled when agreeing the contract.

## Frontend

Keep product details independent of review loading. A review section owns aggregate/list loading, cursor, load-more and retry state, and handles cancellation or stale responses when product identity changes. An observer triggers further loading with a visible Load more fallback; failure of a later batch retains earlier items. On successful submission, close the form, show success, and reload the first batch and aggregate so the newest review appears first. If that refresh fails, show the review-loading error without claiming submission failed.

A review form dialog handles star selection, optional fields, accessible labels and validation. Center it on desktop and present it full-screen on mobile. Focus is contained while open and returned to the trigger on close; a separate confirmation protects a nonempty draft. Prevent duplicate in-flight submits. On failure preserve editable values; reuse the submission ID for unchanged normalized content, generate a new ID after changes. No pending submission persistence across navigation or reload is planned.

## Tests in phase 3

- API integration against isolated PostgreSQL: validation boundaries; missing/unavailable products; ordering and cursor ties; aggregate over all pages; import preservation; concurrent same-ID submissions and replay/conflict semantics; generic failure handling.
- Frontend Jest: form validation and optional fields; draft confirmation and focus behavior; success and failure states; retry ID behavior; first and later page failure; stale response handling.
- Playwright with isolated fixtures: representative desktop and mobile reading and submission, empty state, dialog and discard confirmation, and successful list/summary refresh. Avoid duplicating every API boundary in browser tests.

These are proposed test cases, not tests implemented or run. Browser usability review is part of later implementation verification. Phase 4 remains the separate adversarial test review.
