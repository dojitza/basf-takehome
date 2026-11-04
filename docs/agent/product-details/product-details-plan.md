# Product details, sharing and navigation — v0.2.0

Status: phase 1 behavior reviewed by the human; phase 2 architecture accepted for proceeding; phase 3 test batch written and phase 4 adversarial test review completed; phase 5 implementation completed and verified green; phase 6 adversarial review of implementation completed. v0.2.0 is a target, not a released or accepted version.

## Delivery checklist

- [x] 1. Behavioral analysis and scope — consolidated behavior reviewed by the human.
- [x] 2. Architectural constraints — proposed approach accepted for proceeding; UUID identity agreed.
- [x] 3. Build tests — test-first batch written and baseline run; results and limitations below.
- [x] 4. Adversarial review of tests.
- [x] 5. Implement to pass tests.
- [x] 6. Adversarial review of implementation.
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

## Phase 2: architectural proposal

These technical choices are agreed for proceeding, but are not implemented or verified contracts. They preserve the existing technology stack and require no schema migration or new product write path.

### Identity and API

- Use the existing Product UUID as the route identity: `/products/:id`, and add `id` to catalogue items. The import upserts by normalized SKU and keeps the existing ID for a continuing or returning SKU. UUIDs avoid putting arbitrary imported SKU characters into route segments, but links depend on retaining the database: rebuilding it from CSV creates new IDs. A changed SKU is treated as a different product by the existing importer. SKU-based links could survive database rebuilds, but require URL-safe encoding and a policy for SKU changes. The human confirmed that survival across normal imports is sufficient; rebuild durability is not required.
- Add `GET /api/products/:id`, selecting the agreed customer-facing fields plus status and import-presence information needed to explain availability. Look up by identity independently of catalogue filters and import presence. A malformed UUID or missing record returns 404; infrastructure failures return a server error, never a false 404. Do not expose timestamps or other import/database metadata in the response. The UUID is an opaque link identifier, not a displayed product property.
- Keep the existing list endpoint and its bounded incremental-loading contract. Derive availability consistently for list and detail: absence takes precedence over source status, then UNKNOWN maps to unavailable. Share this mapping at the appropriate boundary without adding a general-purpose framework.

### Routes, criteria and navigation

- Introduce Angular catalogue and detail routes under a common application shell; extract the existing catalogue from the root component, keeping its established search, filter, sort and loading behavior. The detail page owns its request, loading, not-found and error states. A route parameter change must clear prior content and cancel or ignore obsolete responses.
- Preserve the current catalogue query parameter names and repeated `status`/`applicationArea` values. Encode applied criteria in both catalogue and product URLs, omitting defaults. Only committed state enters links; drafts, batches and position do not. Serialize via the router so values are properly encoded. Keep criteria parsing and serialization shared between pages instead of maintaining divergent formats.
- Continue the existing invalid-criteria policy: ignore unsupported values, use defaults and notify the customer. Application-area validity depends on current catalogue data, so preserve candidates in the detail link until the catalogue can validate them; a failed detail request must not prevent returning with those candidates. Handle oversized search and malformed or repeated scalar parameters predictably before querying; specify precise normalization in tests.
- Product identity is independent of query parameters. Back to catalogue navigates to `/` with carried criteria, rather than relying on browser history. Browser Back naturally returns to its previous history entry; when that entry is the catalogue, reload current results at the top. Opening directly in a new tab still offers a deterministic catalogue return. Ensure navigation resets scroll and sets sensible focus after the view is rendered, including browser Back and error states.
- Existing nginx configuration serves the Angular entry point for deep links and proxies `/api/`; verify direct routes and refresh in both development and container/browser tests. Links require a host configured for SPA fallback.

### Sharing and accessibility

- Generate absolute links from the current origin and the router-generated URL, without query drafts or location state. Use the Web Share API when available and a separate Copy link action; cancellation is not an error. On clipboard failure, expose a selectable link for manual copying with accessible feedback. Feature-detect browser capabilities and avoid claiming a successful copy/share without confirmation.
- Use real anchors for product rows and catalogue return, retaining native modified-click, keyboard and context-menu behavior. Announce asynchronous loading/errors appropriately and place focus on the destination heading or equivalent landmark on page navigation; do not restore the prior row or scroll position. Respect the device's native share sheet.

### Verification boundaries

Phase 3 will write tests before implementation; phase 4 will review those tests adversarially. Cover the direct lookup against PostgreSQL (including retained/unknown records and errors), criteria round trips, stale-request handling, navigation and sharing fallback with focused frontend tests, plus a small set of desktop/mobile browser journeys including refresh/deep links, keyboard behavior and return to top. A real mobile share sheet and assistive-technology behavior need human/device review; mocks alone cannot establish them. Existing catalogue behavior and tests remain regression coverage.

### Phase 3 test batch

- PostgreSQL integration coverage in `apps/api/test/catalogue-browsing.integration-spec.ts` exercises list identity, detail fields, status and absence, missing values, imports that remove and restore a product, missing/malformed identity and service failure. The missing-ID case currently passes vacuously because all detail routes return 404.
- Browser coverage in `tests/e2e/product-details.spec.ts` exercises desktop/mobile navigation, direct links and reload, return criteria and top position, loading/retry and stale response behavior, availability and missing fields, applied versus draft state, criteria validation, catalogue/product copy and native-share mocks, and clipboard fallback. It uses an isolated database and controlled HTTP responses where specific details or timing are required.
- Baseline against the unimplemented application: 42 of 53 API integration tests passed and 11 failed; all 21 collected browser tests failed. Most browser journeys stop at the first missing route or control, so later assertions have not yet been exercised. One stale-response synchronization change was made after the browser baseline run; static checks cover it, but it has not been dynamically exercised. These results do not establish that the new tests will pass or are free of defects after implementation.
- The next phase must challenge test correctness, gaps and brittleness before implementation. Device-native share sheets, real clipboard permission behavior, screen-reader output and human visual/interaction acceptance require separate review; browser mocks do not prove them.

### Phase 4 adversarial test review

- **Frontend Jest contradiction and missing boundary resolved:** Fixed `apps/web/src/app/catalogue-browsing.spec.ts` (which previously asserted zero `.products a` links, contradicting v0.2.0 whole-row links, and omitted `id` in sample items) and added `apps/web/src/app/product-details.spec.ts` (27 cases) covering whole-row links, all customer-facing fields, missing/unnamed fallbacks, availability precedence across all status/import combinations, markup escaping, property-based criteria round-trip and malformed-query normalization (`search > 200`, repeated scalar `search`/`sort`, whitespace-only `applicationArea`, candidate `applicationArea` preservation across 200/404/503 detail responses), stale-request concurrency, duplicate-retry guards, and API/clipboard/Web Share fault injection.
- **PostgreSQL integration hardened (`apps/api/test/catalogue-browsing.integration-spec.ts`):** Eliminated the vacuous 404 pass (asserting domain 404 rather than NestJS's default `Cannot GET` route-missing response and verifying that non-UUID primary keys and property-generated malformed IDs are rejected), added case-insensitive UUID lookup coverage against the `TEXT` primary key, tested `applicationArea: null` and multi-certification arrays with exact 12-key schema checks on all detail responses, verified lookup independence from invalid catalogue query parameters, added concurrent import + detail/list read consistency coverage, and injected Prisma-specific infrastructure errors (`P1001`, `PrismaClientInitializationError`) to ensure database failures never masquerade as 404s.
- **Playwright E2E hardened (`tests/e2e/product-details.spec.ts`, `scripts/run-browser-tests.mjs`):** Added `pageerror` listeners for uncaught exceptions/unhandled rejections; replaced unnecessary `page.route` stubs with real PostgreSQL records (`P-001`..`P-004`, `P-121` absent discontinued, `P-122` unnamed all-null absent); added whole-row anchor geometry, heading focus placement, deep-link logo rendering, no-horizontal-overflow, and exact 6-count `"Not provided"` assertions; verified both `Back to catalogue` and Browser Back (`page.goBack()`) after scrolling multiple batches reset `window.scrollY` to `0` and batch count to one batch; and verified clipboard failure feedback without false copy-success claims plus hidden native `Share` when `navigator.share` is unsupported.
- **Post-review baseline (unimplemented application):** API unit tests pass (69/69); Frontend Jest runs 57 tests (29 pass, 28 fail on unimplemented v0.2.0 routes/links and unimplemented catalogue query normalization for oversized search, repeated scalars, and whitespace-only application areas); PostgreSQL integration runs 74 tests across 3 suites (58 pass, 16 fail in `catalogue-browsing.integration-spec.ts` with zero vacuous passes on detail routes); existing 13 catalogue Playwright tests pass (13.6 s), and all 21 product-details Playwright tests fail at the expected missing routes/controls.

### Phase 5: implementation to pass tests

Implemented full frontend and backend slices to fulfill the agreed v0.2.0 contracts:

1. **Backend API (`apps/api/src/products.controller.ts`):**
   - Added `id` selection to `GET /api/products` catalogue list query.
   - Added `GET /api/products/:id` selecting exactly the 12 customer-facing and availability fields (`id`, `sku`, `name`, `chemicalName`, `function`, `applicationArea`, `region`, `certifications`, `status`, `launchYear`, `description`, `presentInLatestImport`).
   - Validates UUID structure via regex, rejecting malformed and non-UUID primary keys with a domain 404 (preventing route-missing `Cannot GET` responses and database exceptions from leaking). Accepts uppercase/mixed-case UUIDs via lowercase normalization.
   - Preserves infrastructure error responses (P1001, initialization errors, unexpected DB failures) as generic server errors without leaking SQL, passwords, or Prisma internals.

2. **Frontend Architecture & Routing (`apps/web/src/app/`):**
   - Extracted `CatalogueComponent` (`apps/web/src/app/catalogue/`) from `App`, keeping `App` as the slim application shell with `<header>` and `<router-outlet>`.
   - Configured Angular Router routes: `''` maps to `CatalogueComponent`, `'products/:id'` maps to `ProductDetailsComponent`, and `'**'` redirects to `''`.
   - Added `apps/web/src/app/criteria.ts` containing shared normalization, query parameter serialization, and status display utilities. Handles oversized `search > 200`, repeated scalar parameters (`search`, `sort`), whitespace-only `applicationArea`, and invalid `status`/`sort` values with user warning banners and clean defaults.
   - Preserves candidate application areas in detail return links for catalogue data validation.

3. **Product Details & Accessibility (`apps/web/src/app/product-details/`):**
   - Dedicated page fetching `/api/products/:id` with loading state (`[aria-busy="true"], [role="status"]`), 404 Product Not Found (without Retry), and temporary service failure alert (with single in-flight duplicate-click guarded Retry).
   - Automatically sets focus to the `<h1>` heading upon successful load and on 404 error views.
   - Renders all customer-facing fields with exact agreed fallback texts: SKU heading fallback when unnamed, exact 6-count `"Not provided"` for missing nullable scalar fields, and `"None listed"` for empty certifications.
   - Strictly enforces availability precedence: `presentInLatestImport === false` takes precedence over source status with the agreed absent explanation; `status === 'UNKNOWN'` explains unconfirmed availability; valid statuses display appropriate badges without inventory/stock assertions.
   - Immediately clears previous product details upon route navigation, cancelling in-flight requests and ignoring obsolete late responses or errors.

4. **Sharing & Navigation Fallback:**
   - Feature-detects `navigator.share`, showing native Share button only when supported and ignoring cancellations (`AbortError`) without false copy success claims.
   - Implemented Copy Link with success feedback banner and fallback to an accessible readonly textbox with failure feedback when clipboard write permissions fail or clipboard API is unavailable.
   - Added whole-row links covering item geometry in catalogue rows. Back to catalogue and Browser Back preserve carried criteria, reset scroll position (`window.scrollY = 0`), and start at the top with a single batch.

5. **Verification Evidence:**
   - API unit tests: 69/69 pass.
   - Frontend Jest: 57/57 pass across `app.spec.ts`, `catalogue-browsing.spec.ts`, and `product-details.spec.ts`.
   - PostgreSQL integration: 74/74 pass across 3 suites (`catalogue-browsing.integration-spec.ts`, `catalogue-import.integration-spec.ts`, `health.integration-spec.ts`).
   - Playwright E2E: 34/34 pass across desktop and mobile viewports (`catalogue-browsing.spec.ts`, `catalogue-design.spec.ts`, `product-details.spec.ts`).
   - `npm run check` passes lint, format check, unit tests, and production builds for both apps.

### Phase 6: adversarial review of implementation

Reviewed the Phase 5 commits (`edd8c62` and `59b2b59`) across backend and frontend against this plan, the visual reference boards, and [future code review criteria](../code-review.md) (Readability, Responsibilities, Duplication, Correctness, Verification). No application code was modified during this review phase.

#### Concrete defects (correctness, accessibility, routing, and layout)

1. **Missing heading and focus management on detail service-error states and catalogue return (`apps/web/src/app/product-details/product-details.ts#L120-L169`, `apps/web/src/app/product-details/product-details.html#L104-L108`, `apps/web/src/app/catalogue/catalogue.ts#L106-L125`, `apps/web/src/app/catalogue/catalogue.html#L15`):**
   - *Impact:* While 200 and 404 responses on `ProductDetailsComponent` set `shouldFocusHeading = true` and focus `<h1 #heading tabindex="-1">`, non-404 service errors (`@else if (error)`) render `<div role="alert" class="error">` without a heading or focus target (`shouldFocusHeading` is never set on lines 164–167). Similarly, returning to `CatalogueComponent` via `Back to catalogue` or Browser Back destroys `ProductDetailsComponent` without placing focus on the catalogue `<h1 tabindex="-1">Products</h1>` or main landmark, leaving keyboard focus on `document.body`. This violates the phase 2 agreement (*"Ensure navigation resets scroll and sets sensible focus after the view is rendered, including browser Back and error states"*).
   - *Smallest fix:* Add `<h1 #heading tabindex="-1">Unable to load product</h1>` inside the detail error block and set `this.shouldFocusHeading = true` in the non-404 error branch of `loadProduct()`; add `#heading tabindex="-1"` to `CatalogueComponent`'s `<h1>Products</h1>` and focus it when navigating back from product details.

2. **Invalid-criteria warning state leak via `history.state` (`apps/web/src/app/product-details/product-details.ts#L109-L116`, `apps/web/src/app/product-details/product-details.html#L7`, `apps/web/src/app/catalogue/catalogue.ts#L112-L117`):**
   - *Impact:* `ProductDetailsComponent` strips invalid `status`/`sort` parameters immediately when computing `criteriaQueryParams` for `Back to catalogue`, and passes `[state]="{ warning: hasWarning }"` to make `CatalogueComponent` show its warning banner on return. In `CatalogueComponent`, `this.warning = parsed.hasWarning || Boolean(locationState?.warning) || Boolean(history.state?.warning)` reads `history.state.warning` on every `queryParamMap` emission without clearing it, so a `true` warning in `history.state` can stick across subsequent valid interactions or history traversals. Conversely, middle-clicking or opening `Back to catalogue` in a new tab drops `history.state` and loses the warning, while `ProductDetailsComponent` computes `hasWarning` (`product-details.ts#L114`) without ever rendering a notice on the detail view itself.
   - *Smallest fix:* Render the invalid-criteria warning banner on `ProductDetailsComponent` when `hasWarning` is true (or consume and clear transient `history.state.warning` via `replaceState` on initial read in `CatalogueComponent` so it cannot persist across subsequent valid query changes, and omit `[state]` when `hasWarning` is false).

3. **Stale clipboard / share feedback across criteria changes and unguarded async clipboard completion (`apps/web/src/app/catalogue/catalogue.ts#L110-L122`, `apps/web/src/app/catalogue/catalogue.ts#L410-L433`, `apps/web/src/app/product-details/product-details.ts#L109-L116`, `apps/web/src/app/product-details/product-details.ts#L201-L224`):**
   - *Impact:* In `CatalogueComponent`, `route.queryParamMap` updates do not reset `copiedMessage`, `copyFailed`, or `manualLink` (and in `ProductDetailsComponent`, `queryParamMap` changes do not reset them either). If a customer copies a link (or triggers the manual copy fallback textbox showing `http://.../?search=Old`) and then changes search, filter, or sort criteria, the stale `"Link copied to clipboard."` message or the outdated URL in the fallback textbox remains on screen for the new criteria. In addition, `await navigator.clipboard.writeText(url)` does not check whether the active URL or component lifecycle changed while the promise was pending.
   - *Smallest fix:* Reset `copiedMessage`, `copyFailed`, and `manualLink` whenever `queryParamMap` (or committed criteria) changes on both components, and guard async `copyLink()` resolution with a request/generation counter and destroy check.

4. **Sharing controls shown on detail loading, 404, and 503 states (`apps/web/src/app/product-details/product-details.html#L4-L66`):**
   - *Impact:* `.detail-nav` unconditionally renders `.share-actions` (`Share` and `Copy link`) while `loading`, `notFound`, or `error` is active, and omits the centered recovery `Back to catalogue` action inside the 404 and 503 cards shown in the visual references (`references/loading.png`, `references/not-found.png`, `references/service-error.png`).
   - *Smallest fix:* Render `.share-actions` only when `product` is loaded (`@if (product)`), and include the recovery `Back to catalogue` link alongside `Retry` in the 404/503 states as shown in the visual references.

5. **Mobile toolbar crowding on Catalogue and narrow-screen grid minimum on Product Details (`apps/web/src/app/catalogue/catalogue.html#L21-L121`, `apps/web/src/app/catalogue/catalogue.scss#L274-L285`, `apps/web/src/app/product-details/product-details.scss#L131-L135`):**
   - *Impact:* Placing `Share` and `Copy link` inside `.toolbar` with `class="toolbar-button"` forces 4 buttons (or 5 buttons when `navigator.share` is available on mobile) into a single non-wrapping flex row (`flex: 1 1 0; padding-inline: 0.35rem`) below `600px`, leaving ~55px per button on a `360px`–`390px` viewport and cramping labels/icons compared to `references/catalogue.png` (which places `Share` and `Copy link` in a secondary row below `Search`, `Filters`, and `Sort` on mobile). On `ProductDetailsComponent`, `.product-properties` uses `minmax(18rem, 1fr)`, which sits right at the `288px` content width of a `320px` viewport.
   - *Smallest fix:* Group `Share` and `Copy link` so they wrap cleanly onto a second row on mobile viewports (`max-width: 600px`) while keeping `Search`, `Filters`, and `Sort` equal-width on the first row, and change `.product-properties` to `minmax(min(100%, 18rem), 1fr)`.

6. **Wildcard route `{ path: '**', redirectTo: '' }` masks unknown paths (`apps/web/src/app/app.routes.ts#L8`):**
   - *Impact:* Navigating to an unknown or multi-segment URL (such as `/products/extra/segment` or a mistyped path) silently redirects to the catalogue root `/` instead of rendering a not-found state.
   - *Smallest fix:* Route unknown paths (`**`) to `ProductDetailsComponent` (or a not-found state preserving valid carried criteria) rather than silently redirecting to `''`.

#### Maintainability, responsibilities, and duplication findings

7. **Duplicated share/clipboard state, logic, and styles across `CatalogueComponent` and `ProductDetailsComponent` (`apps/web/src/app/catalogue/catalogue.ts#L67-L70`, `apps/web/src/app/catalogue/catalogue.ts#L387-L440`, `apps/web/src/app/product-details/product-details.ts#L39-L42`, `apps/web/src/app/product-details/product-details.ts#L178-L231`):**
   - *Impact:* `canShare`, `copiedMessage`, `copyFailed`, `manualLink`, `getAbsoluteUrl()`, `share()`, and `copyLink()` (along with `.copy-banner` and `.copy-fallback` templates/styles) are duplicated nearly verbatim across both components. Any bug fix (such as resetting state on criteria change or guarding async clipboard writes) must currently be maintained in two places.
   - *Smallest fix:* Extract a small shared helper or component/controller for link sharing and clipboard fallback, or consolidate the state transition logic in a shared module.

8. **Split availability derivation between `criteria.ts` and `ProductDetailsComponent` (`apps/web/src/app/criteria.ts#L105-L122`, `apps/web/src/app/product-details/product-details.ts#L171-L176`):**
   - *Impact:* `statusLabel()` and `statusSeverity()` live in `criteria.ts`, whereas `isUnavailable()` and the availability explanation rules live in `ProductDetailsComponent` (`product-details.ts` and `product-details.html#L121-L128`), and `criteria.ts` mixes URL query parsing with product availability presentation.
   - *Smallest fix:* Keep customer-facing availability helpers (`statusLabel`, `statusSeverity`, `isUnavailable`) together so list and detail views share a single source of truth.

9. **Redundant `this.router.initialNavigation()` in `App.constructor()` and tracking key in `catalogue.html` (`apps/web/src/app/app.ts#L16-L34`, `apps/web/src/app/catalogue/catalogue.html#L250`):**
   - *Impact:* `provideRouter(routes)` already performs initial navigation; calling `this.router.initialNavigation()` inside `App.constructor()` triggers a duplicate synchronous navigation on component creation (which causes an immediate cancelled `/api/products` request whenever a test creates `App` before calling `router.navigateByUrl`), and the `router.events` subscription in `App` lacks `takeUntilDestroyed()`. In `catalogue.html#L250`, `@for (product of products; track product.sku)` still tracks by `sku` rather than `product.id`.
   - *Smallest fix:* Remove the redundant `this.router.initialNavigation()` call if not required by tests, add `takeUntilDestroyed()` to `App`'s router subscription, and track catalogue items by `product.id`.
