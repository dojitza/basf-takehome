# Product details, sharing and navigation — v0.2.0

Status: phase 1 clarification complete; consolidated understanding awaits human review. Individual behavior choices were agreed during discussion. v0.2.0 is a target, not a released or accepted version. No tests or implementation started for this slice.

## Delivery checklist

- [ ] 1. Behavioral analysis and scope — clarification complete; awaiting human review of the consolidated understanding below.
- [ ] 2. Architectural constraints — establish boundaries and contracts for the agreed behavior.
- [ ] 3. Build tests.
- [ ] 4. Adversarial review of tests.
- [ ] 5. Implement to pass tests.
- [ ] 6. Adversarial review of implementation.
- [ ] 7. Address implementation review findings.
- [ ] 8. Human behavioral review and click-through.
- [ ] 9. Address human review in a loop until the human accepts the behavior.
- [ ] 10. Final adversarial review for gaps after human review.
- [ ] 11. Final implementation addressing that review, with appropriate verification.

Review criteria: [future code review criteria](../code-review.md). The review stages above apply to this slice; the previously discussed broad five-pass refactoring exercise remains deferred. Reviewer assignment and any delegation are not selected here.

## Outcome and scope

Customers can inspect a product, understand its availability, share a product or catalogue search, and return to the catalogue with applied criteria preserved. Catalogue visits and returns start at the top.

## Product inspection

- The whole catalogue row is an accessible link to a dedicated product page. Support keyboard activation, opening in another tab and copying the link.
- Use the existing visual style in a responsive desktop/mobile page with Back to catalogue and sharing controls. No review placeholders or invented product actions.
- Show name, SKU, chemical name, description, function, application area, region, certifications, launch year and customer-facing availability. Exclude database/import metadata.
- When the name is missing, use SKU as the title. Missing properties say “Not provided”; empty certifications say “None listed”, without implying the product is uncertified.
- Preserve active, phase-out, discontinued and unavailable categories. Retained products absent from the latest import remain directly accessible, prominently unavailable with an explanation that they are absent from the latest catalogue. Unknown source status is unavailable with availability described as unconfirmed. Do not imply stock levels or orderability.

## Sharing

- Catalogue links carry applied search, filters and sort, using current data. Do not share draft edits, loaded batch count or scroll position.
- Product links identify the product independently of catalogue criteria and work after reload or in a fresh session. When shared from a catalogue context, include its applied criteria so Back to catalogue opens that search. Show the product even if it no longer matches those criteria.
- A product link without catalogue criteria returns to the default catalogue.
- Both catalogue and product views offer native sharing where supported plus Copy link. Cancellation is normal. Provide copy success/failure feedback and manual copying if clipboard access fails.

## Navigation and recovery

- Keep existing incremental loading. Browser Back from details and Back to catalogue preserve applicable search, filters and sort, fetch current matching data and start at the top. No scroll restoration, previously loaded batch restoration or return focus on the previously opened row.
- Use sensible accessible focus placement on page navigation; maintain usable keyboard interaction and mobile reading order.
- Show an appropriate loading state. An invalid/nonexistent product shows Product not found with Back to catalogue, preserving valid carried criteria.
- A temporary service failure shows an error with Retry and Back to catalogue. Never show a previous product’s details as the current product.
- Links do not promise a historical snapshot of catalogue data.

## Boundaries and alternatives

New filters and sort choices are deferred to the [following slice](../catalogue/catalogue-filter-sort-follow-up.md). Reviews, ratings, individual-review links, recent searches, desktop density/data-grid redesign and broad refactoring are outside this slice.

Details and reviews stay separate to keep navigation/read behavior reviewable before adding persistence, validation and public writes. A dedicated page was selected over a modal for product inspection. Keeping incremental loading avoids a pagination redesign; criteria-only return avoids scroll recovery complexity.

The required Angular/PrimeNG, NestJS, Prisma and PostgreSQL constraints remain. This slice uses imported data and introduces no new write flow. Concrete API contracts, route/link identity, criteria serialization and component boundaries belong to phase 2.

## Representative acceptance behavior

These are acceptance examples for review, not implemented or executed tests:

1. Apply search, filters and sort; load several batches; open a product. Details match the imported record. Both return actions open the catalogue at the top with the same criteria.
2. Share a catalogue search and open it in a fresh session. Applied criteria are restored, current matches begin at the top, and uncommitted drafts are excluded.
3. Share a product from a filtered catalogue and open it in a fresh session. The product opens directly. Back to catalogue applies the carried criteria, even if that product no longer matches them. Reloading the product link still works.
4. Open a product link without catalogue criteria. Back to catalogue opens the default catalogue.
5. Open an unnamed product with missing properties. SKU identifies it and the agreed missing-value text appears.
6. Open retained absent, unknown-status, phase-out and discontinued products. Their details remain readable with the correct status and applicable explanation.
7. Use native sharing, cancel it, copy a link, and encounter a clipboard failure. Cancellation is normal, successful copying has feedback, and manual copying is available on failure.
8. Visit an invalid/missing product or encounter a service failure. The appropriate recovery actions preserve valid catalogue criteria, without stale product content.
9. Navigate and share on mobile and with a keyboard. Product links, focus, reading order and recovery actions remain usable.

## Visual references

The human indicated the ImageGen references looked good. They are illustrative design references for review, not implemented screens; example product values, certifications and URLs may be invented. Search/filter/sort controls on detail states were generated and have not been agreed for those pages. Native sharing uses the device's share sheet.

- [Catalogue](references/catalogue.png)
- [Product details](references/product-details.png)
- [Loading](references/loading.png)
- [Product not found](references/not-found.png)
- [Service error](references/service-error.png)
- [Sharing feedback](references/sharing-feedback.png)
- [Unavailable product and missing fields](references/unavailable-missing-fields.png)

## Phase 1 review gate

Awaiting the human’s review of this consolidated understanding. Do not advance to phase 2 until that review is resolved. The delivery checklist remains open; no human click-through acceptance or technical verification is claimed.
