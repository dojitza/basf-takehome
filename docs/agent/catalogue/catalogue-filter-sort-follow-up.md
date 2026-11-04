# Additional catalogue filters and sorting

Status: deferred to the slice following product details, sharing and navigation. No version assigned; no implementation or tests started. Reconfirm scope before starting.

## Discussion retained for planning

Existing behavior includes status/application-area filters and name A–Z/Z–A sorting.

- The human supported adding launch-year sorting in principle. Proposed choices are newest/oldest first, with unknown years last; unknown placement has not been agreed. Label it by launch year rather than import recency.
- Codex recommended function filtering as the smallest useful addition: the supplied CSV has eight functions, including emulsifier, solvent and preservative. Selection and multi-select semantics remain open.
- Certification filtering is another candidate. Decide whether multiple selections require any or all selected certifications, and how products without listed certifications behave.
- Region filtering is another candidate. Decide whether selecting a region also includes Global products and what selecting Global itself means.
- Codex recommended retaining name and launch year as the sort choices. SKU sorting was discussed as an alternative with less clear value because SKU search already exists. No additional sort choice was selected. Rating sorting depends on future reviews; relevance sorting needs a defined ranking behavior.

Any agreed additions should work with existing filters, applied URL state, catalogue sharing, reset behavior and return navigation. Define missing-value handling and stable ordering across batches. Extend verification to combinations and restoration.

These are planning inputs, not an approved feature list. The current [product details slice](../product-details/product-details-plan.md) adds no new filters or sort choices.
