# Catalogue browsing — proposed behavioral coverage

Status: an initial test-first batch exists in `apps/web/src/app/catalogue-browsing.spec.ts`, `apps/api/test/catalogue-browsing.integration-spec.ts` and `tests/e2e/catalogue-browsing.spec.ts`. The new tests currently stop at the missing catalogue request, endpoint or screen; their later assertions remain unverified. The browser runner creates its own temporary database and local processes; see README for commands. Existing import tests remain separate. These are behavior groups, not a promised number of test cases.

Use the smallest boundary that proves a behavior. A few browser journeys intentionally overlap lower-level assertions to verify real wiring; do not repeat every combination across suites. Test existing PrimeNG controls through our composition and configuration, rather than reproducing the library's own suite. Design images are illustrative and are not test specifications.

## Decisions needed before concrete expectations

The human selected trimmed, case-insensitive substring search over product name and SKU; present products by default; status and application-area filters; OR within a filter and AND across filters; and name ascending/descending with unnamed products last and SKU tie-breaks. Unavailable combines unknown and absent products, while discontinued remains separate and source status/presence remain independent. Desktop searches after a pause and commits a history entry on Enter or blur; mobile waits for confirmation. Invalid filter/sort URL values are ignored with a short warning and defaults. Drawer edits require Apply; dismissing discards drafts. Recent searches, product details and reviews are deferred. Query validation details, wire format and returning to the previous list position remain open. Exact shared scroll position is not agreed.

The tests use a **provisional test adapter**: `GET /api/products`, `search`, repeated `status`/`applicationArea`, `sort`, `limit` and `offset`, returning `items`, `total` and `nextOffset`. These names and the offset choice are test scaffolding, not an approved API contract. Adjust the adapter and assertions together when the API is designed; preserve the agreed behaviors.

## Frontend unit/state — Jest

- **U1 — URL round trip:** supported search/filter/sort state survives serialization and parsing, including spaces, punctuation, Unicode and multiple selections where supported. Defaults have a consistent representation.
- **U2 — Invalid URL state:** missing, unknown, repeated or malformed parameters follow the chosen fallback/error policy without crashing or displaying a different state from the query being sent.
- **U3 — New query resets results:** changing committed search/filter/sort discards old continuation and accumulated results; opening a panel or editing an uncommitted draft does not issue a new query.
- **U4 — Obsolete responses:** a slow first-batch or next-batch response from a previous query cannot overwrite or append to the current results. Cover a late error as well as a late success.
- **U5 — Batch request coordination:** repeated automatic/manual triggers while a batch is in flight issue one request and append it once, in order. Use controlled asynchronous responses without real timers.
- **U6 — End of results:** the continuation/end response stops further automatic requests, including empty catalogue and terminal batch cases; a fresh query can load again.

Exercise request coordination here only if there is a stateful boundary to test independently; otherwise move U3–U6 to frontend integration rather than duplicate them.

## Frontend integration — Angular, router and controlled HTTP in Jest

- **F1 — Product summary:** response data produces the required name/identifier, concise supporting information and textual availability; normal, absent/unknown and missing-name examples follow the agreed presentation rules.
- **F2 — Initial loading:** show loading while the initial request is pending, avoid flashing an empty-state message, and remove the busy state on completion.
- **F3 — Empty states:** distinguish an empty catalogue from no matches where appropriate; clearing the relevant criteria offers a path back to results.
- **F4 — Initial failure:** show a recoverable error, keep the current search/filter/sort, and retry the same criteria successfully.
- **F5 — Further-batch failure:** retain already loaded products, show an error near the continuation point, and retry the failed batch without duplicating previous rows or entering an automatic retry loop.
- **F6 — Appending and announcements:** append new results without moving the user's focus; expose loading, loaded/end and error feedback accessibly without repeatedly announcing the whole list. Actual scrolling and accessibility behavior also need browser verification.
- **F7 — Active selections:** supported filter/sort/search controls and selection pills agree with committed state; remove one or clear all without unintentionally clearing unrelated criteria. Decide the reset-to-default sort behavior first.
- **F8 — Drawer lifecycle:** controls initialize from committed state; Apply, Clear, Cancel and closing follow the agreed draft policy. Accessible names, selected state and trigger expanded state match what is displayed.
- **F9 — Full-screen search lifecycle:** opening initializes the field, the chosen submit action commits the query, clearing works, and dismissal follows the agreed cancellation policy while preserving unrelated filters/sort.
- **F10 — Router integration:** opening a URL initializes the correct controls and request; UI changes update the URL and browser history as agreed; Back/Forward restore the corresponding state. A real reload and fresh shared URL are covered in Playwright.
- **F11 — Imported text and fallbacks:** long names/descriptions and missing values render safely; text resembling markup is displayed as text and cannot introduce executable markup. Responsive overflow is checked in the browser.
- **F12 — Available navigation:** the screen exposes only working actions/routes. When details exist, each whole row is one meaningful keyboard-focusable product link, with an identifiable destination and no nested unrelated controls. Do not add placeholder navigation to satisfy the concept images.

## Backend request/response — Jest with NestJS HTTP wiring

- **B1 — Supported request:** omitted parameters receive agreed defaults and supported search/filter/sort/batch parameters are normalized consistently before querying.
- **B2 — Invalid request:** reject invalid filter/sort values, malformed or out-of-range batch controls, unreasonable input lengths and unsupported repeated-value shapes with a useful client error. Parameterize representative boundaries rather than enumerate every string.
- **B3 — Continuation validity:** invalid continuation values produce the chosen client error. If using query-bound cursor tokens, reject reuse with different criteria; do not require cursor-specific behavior before selecting the contract.
- **B4 — Response contract:** return only the agreed product summaries and consistent continuation/count metadata, with explicit optional/missing values. An empty result is a successful list response.
- **B5 — Dependency failure:** database failure returns a generic service error, without SQL, stack traces or credentials. Validation errors remain distinguishable from service errors.

If the real HTTP/database integration suite already proves B1–B4 economically, keep those assertions there and avoid a second suite with a mocked Prisma implementation. Keep a small stubbed failure case where controlled dependency failure is useful.

## Backend/database integration — Jest, real PostgreSQL and migrations

- **D1 — Visibility policy:** use a compact fixture covering active, phase-out, discontinued, unknown and absent products. Verify default visibility and explicit unavailable/status filtering once agreed, including the precedence of absence over source status.
- **D2 — Search semantics:** search supported fields independently and verify agreed case, whitespace and partial/exact matching with a few distinctive SKU/name values, including Unicode. Do not assume accent-insensitive or relevance behavior without agreement.
- **D3 — Literal special input:** punctuation, quotes and wildcard characters follow the chosen matching rules; user input cannot alter query structure or broaden matches unexpectedly.
- **D4 — Individual filters:** each supported filter returns the correct subset; an otherwise valid selection with no matches returns an empty result. Test any filter-options endpoint only if it is included.
- **D5 — Combined criteria:** search and filters combine correctly; multiple choices within a filter and choices across filters use the agreed OR/AND rules. Use a small fixture that distinguishes these outcomes.
- **D6 — Sorting:** each supported order is correct, including the default, equal sort values, case differences and nullable names. A stable unique tie-breaker prevents ambiguous batch boundaries.
- **D7 — Complete traversal:** following continuations across several batches on a stable dataset returns every matching product exactly once, in order, with no omissions or duplicates. Include tied sort values at a boundary.
- **D8 — Batch boundaries:** empty, fewer-than-one-batch, exactly-one-batch and one-extra-product cases produce bounded batches and correct continuation/end metadata.
- **D9 — Count consistency:** if the contract provides a total, it counts all matching products under the same visibility/search/filter rules rather than only the returned batch. Test with both matches and zero matches.
- **D10 — Import-to-read integration:** a small subsequent snapshot changes what a fresh catalogue query sees according to the visibility rules, including a retained absent product and a returning product. Existing parser/idempotence/rollback cases stay in the import suite.

Changes to the catalogue during traversal require an explicit consistency policy. Document that question before claiming cursor or pagination stability across concurrent imports. Do not introduce snapshot-isolation requirements through a test by accident.

## Browser end-to-end — Playwright

Use a real browser, frontend, NestJS API and isolated PostgreSQL. Most requests should reach the real API; an individual request may be intercepted to exercise a deterministic network failure. Keep a small Chromium suite instead of multiplying every journey across every viewport and browser.

- **P1 — Find and share:** browse and search using the real API; exercise an agreed filter and sort, open the resulting URL in a fresh browser context, and reload it. Controls and results reflect the same criteria, independent of the original browser's storage.
- **P2 — Automatic and manual continuation:** scrolling near the end actually fetches and appends a batch; the accessible manual path also works; reaching the end stops loading. Assert observable results and a bounded number of requests, with no arbitrary sleeps.
- **P3 — Mobile controls and layout:** at a representative phone width, open the drawer and full-screen search, operate real controls, apply/remove selections and scroll the active pills. Products and controls remain usable without horizontal page overflow or obscured essential actions.
- **P4 — Keyboard and focus:** reach search/filter/sort and the continuation control without a pointer; modal focus remains inside while open, closing restores focus, and newly appended content does not steal it. Verify a practical way past the growing list to other controls. Add row-link keyboard navigation when detail routes exist.
- **P5 — Further-loading recovery:** fail one continuation request, verify existing results remain, retry successfully and confirm normal loading can continue. Reuse the controlled real-stack fixtures rather than stopping a database or waiting for a timeout.

## Conditional and later coverage

- **Recent searches, deferred:** local history records only the agreed committed searches, respects its chosen limit/deduplication rules, supports selecting/removing/clearing, and survives unavailable or corrupt browser storage without breaking search. Unit tests cover the storage policy; one frontend integration case covers using a recent entry, without another browser journey.
- **Product details, when built:** whole-row navigation, fresh direct product URLs, unavailable/missing product behavior and returning to the prior catalogue criteria/place.
- **Reviews, when designed:** individual-review links, including opening a review that is not initially loaded; read/write validation, successful submission and rating behavior. Preserve reviews across re-import in database integration, not by duplicating the complete import suite in Playwright.
- **50,000-product diagnostic:** perform a representative database/query and browser growth check when choosing query/index and list-retention behavior. Keep bulk data setup, EXPLAIN and performance diagnostics outside the frequent correctness suite; do not add brittle wall-clock assertions.
- **Manual accessibility/usability review:** desktop and phone, visible focus, touch targets, real screen-reader announcements, zoom/reflow, long content and drawer/keyboard viewport interaction. Automated checks are supporting evidence, not a complete accessibility audit.

## Keeping the feedback loop short

- Use compact deterministic fixtures that distinguish cases; migrate once per integration setup and clean only isolated test state.
- Use parameterized Jest cases and controlled asynchronous responses. Do not repeat API validation permutations in Playwright or retest all PrimeNG internals.
- Start with about five browser journeys; combine related assertions while keeping each journey independently runnable. Add another only for a distinct integration risk.
- Measure actual runtime after implementation. Aim for focused Jest/database checks in seconds with dependencies already running; report browser/application startup separately. No runtime has been measured for this proposed suite.
