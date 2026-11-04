# To do

- Target v0.2.0: [product details and navigation proposal and eleven-phase delivery checklist](docs/agent/product-details/product-details-plan.md). Phase 1 is in discussion; scope is not yet agreed.
- Following slice: [additional catalogue filtering and sorting](docs/agent/catalogue/catalogue-filter-sort-follow-up.md). Discussion retained; exact scope needs agreement.
- After the agreed core features, consider a focused frontend/backend review using the [future code review criteria](docs/agent/code-review.md). Review and refactoring passes are deferred.
- Explore a denser desktop catalogue layout, including a data grid approach; the current design appears to have too much whitespace. Develop the design further with customers and review alternatives with the human before implementation.
- Define and test product details, whole-row navigation, direct product links and returning to the prior catalogue view when that slice is built.
- Define and test review reading/writing, links to an individual review and review preservation across re-import when reviews are built.
- Consider adding local recent searches later; decide retention/deduplication, then test selection, deletion, clearing and unavailable/corrupt storage.
- Run representative 50,000-product query/list growth diagnostics when query and index choices are made; keep performance checks outside the fast correctness suite.
- Review catalogue accessibility and usability on desktop and mobile, including keyboard, screen reader, touch targets, zoom and viewport behavior.
