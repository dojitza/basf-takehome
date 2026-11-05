# Development log

## 2026-11-02 — Evaluation analysis

The human requested analysis of grading to guide time allocation. Inspected the assignment and CSV; recorded explicit criteria, data anomalies and proposed priorities in [evaluation priorities](evaluation-priorities.md). Recommendations remain proposals; no implementation or scope agreement. No application tests run.

## 2026-11-02 — Repository scaffold

At the human's request, preserved the supplied assignment and CSV and prepared agent guidance and a versioned documentation structure based on the Fonoa take-home. The technology stack and application have not been initialized.

## 2026-11-02 — Collaboration and documentation process

The human accepted the proposed delivery loop and requested simpler documentation grouped by audience: `docs/agent/` and `docs/human/`. Updated AGENTS.md, moved evaluation analysis to human documentation, and replaced the version scaffold with current agent context. AI_USAGE.md is now a working source log of actual AI use, disagreements and human steering for later human editing. Application scope and architecture remain undecided; no application initialized. The root assignment README and supplied CSV remain unchanged.

Verification: `git diff --check` passed; relative Markdown links under docs resolved; `git diff --exit-code -- README.md data/products.csv` confirmed both supplied files unchanged. No application tests were run for this documentation-only change.

## 2026-11-02 — Reserve human documentation

Moved evaluation analysis into agent documentation and updated current guidance and links. `docs/human/` is empty; its future purpose is undecided. The proposed explanatory account of development, architecture and trade-offs is tentative. Collaboration source details are recorded in root AI_USAGE.md.

## 2026-11-02 — Required documentation deliverables initialized

Preserved the supplied README text verbatim in root ASSIGNMENT.md and initialized README.md as the project entry point. Added DECISIONS.md with explicit pending status, supplied constraints, open assumptions and observed risks. AI_USAGE.md remains the working collaboration source log. Updated guidance and navigation. No application implementation or architecture agreement; docs/human/ remains empty.

Verification: `git diff --check` passed. Compared ASSIGNMENT.md byte-for-byte against `HEAD:README.md`; confirmed data/products.csv unchanged, docs/human/ empty, and local Markdown links in the deliverables and supporting docs resolve. Application tests are not applicable to this documentation-only initialization.

## 2026-11-02 — Bootstrap research and proposal

Inspected assignment and local tools; Node 22.22.3, npm 10.9.8 and Docker daemon/Compose are available. Read npm metadata and official Angular, PrimeNG and Prisma documentation to inform a bootstrap proposal. Bootstrap scope and acceptance checks are proposed for review; no application or dependencies initialized. Current dependency licensing/version findings and the human's direction are recorded in root AI_USAGE.md. No build or test result claimed.

## 2026-11-02 — Bootstrap implemented and verified locally

Implemented the agreed infrastructure slice: npm workspaces, Angular 22.2.4/SCSS/PrimeNG 22.1.4 shell, NestJS 12.3.2 ESM readiness API, Prisma/client/adapter 7.10.1 and PostgreSQL 17.6, Node 22.22.3, local watch/proxy setup, multi-stage production containers, Jest, ESLint, Prettier and a GitHub Actions workflow. README documents exact commands and pending feature work; DECISIONS records actual foundation choices. PrimeNG Community key setup is wired to an ignored local file, with normal missing-key behavior retained. Human steering and agent corrections are recorded in AI_USAGE.md.

Verification evidence:

- `npm run check` passed: lint, formatting, 11 API unit cases, one frontend shell/PrimeNG test and both production builds. API Jest uses experimental VM modules; missing-license warnings are expected with the current blank key.
- `npm run test:integration` passed against real PostgreSQL: one HTTP readiness case through Nest and Prisma.
- `docker compose up --build --wait` passed; all three services healthy. The build ran clean `npm ci`, generated Prisma client, built both apps and pruned development dependencies from the API runtime image. OpenSSL installed in the Node base resolves Prisma generation detection warnings.
- Temporary Playwright tooling outside the repository checked local watch mode at port 4200 and container mode at port 8180, at 1280x800 and 390x844: heading and disabled PrimeNG button rendered, proxied readiness returned 200, no browser page errors or horizontal overflow. Inspected the mobile screenshot in /tmp; it includes the normal invalid-license badge. Screenshots/tooling are not repository artifacts.
- Actual database stop returned HTTP 503 with `Database unavailable`; restart restored HTTP 200 without API restart. Compose down/up restored healthy services and preserved PostgreSQL cluster identity on the named volume. This proves infrastructure persistence, not future review/import safety.
- Runtime dependency audit: zero vulnerabilities. Full development audit: 39 findings (3 low, 36 moderate) associated with test-tool dependency chains; no forced downgrades or overrides. Hosted CI and a valid PrimeNG key have not been verified.

Services are left running for human review: web localhost:8180, API localhost:3100, PostgreSQL localhost:5432. Unrelated services occupied 3000 and 8080 and were preserved. No product features, domain models/migrations, seed/import, authentication or moderation implemented. Human review pending; no commit requested for this phase.

## 2026-11-02 — Local development workflow

`npm ci` creates missing local `.env` and PrimeNG configuration without overwriting existing files. `npm run dev` starts Compose PostgreSQL, waits for health, and runs the API and Angular watchers. Ctrl+C leaves the persistent database running. `npm run test:integration` starts a separate PostgreSQL container with temporary storage on port 5433 and explicitly points the test process at it. CI cleanup includes that profile. No migration, import or automatic test-data reset is implemented; these need design when domain work starts. README and DECISIONS describe the workflow and trade-off.

Verification: `npm run check` passed (lint, formatting, 12 unit tests and both builds); isolated PostgreSQL integration test passed. With container web/API stopped, `npm run dev` started both watchers; frontend and proxied readiness responded 200. Ctrl+C stopped the watchers while development PostgreSQL remained running. The test container was stopped, and the previous container web/API stack was restored for review. Hosted CI remains unverified.

## 2026-11-02 — Angular and PrimeNG decision

Documented the decision to keep Angular 22 and PrimeNG 22 together, the assignment and peer-compatibility rationale, and the outstanding company license check in DECISIONS.md. The existing PrimeNG dependency is already pinned to 22.1.4; no dependencies changed. Collaboration context is recorded in AI_USAGE.md.

## 2026-11-02 — Separate local and container API ports

Changed the local API default and Angular proxy to port 3101; Compose retains port 3100. Updated the existing local `.env` only because it contained the previous default. Verified `npm run dev` while the Compose stack remained running: the local API, Angular proxy and container API each returned successful readiness responses. Stopped the temporary local watchers afterward, leaving Compose running. Format and whitespace checks passed.

## 2026-11-02 — Proposed testing strategy

Added testing-strategy.md with candidate browser journeys, Jest and PostgreSQL test boundaries, an incremental test-first loop and isolation requirements for a future Playwright setup. These are plans for discussion and future feature slices, not implemented tests. No application code or test harness changed.

The strategy was subsequently narrowed to the general development and testing process; feature-specific test cases will be agreed when feature work begins.

## 2026-11-02 — Import behavior discussion

The next slice is limited to migrations and importing the PIM CSV. Recorded working assumptions and PM/customer confirmation points in DECISIONS.md; timestamp semantics and some error handling remain under discussion. No import code, migration or import tests have been implemented. CSV inspection confirmed a pipe delimiter for certifications, a blank and an `n/a` launch year, and two duplicate SKUs including one conflicting status. No application tests were run for this documentation update.

The human agreed to warnings and unknown values for unrecognized statuses and malformed years. The current direction treats each file as a complete catalogue and chooses the more pessimistic status for conflicting duplicate IDs, with a prominent flag; detailed policies remain under discussion in DECISIONS.md. No implementation or tests performed.

The human agreed the proposed status ordering, validation safeguards, timestamp semantics and deferred customer-facing behavior; duplicate selection uses the entire row with the more pessimistic status, or the later row if tied. The take-home uses a manual seed with prominent diagnostics. Researched and documented a future nightly PIM contract and operations in [nightly PIM imports](nightly-pim-imports.md), using AWS and Google Cloud guidance; no production pipeline, admin interface, alerts, application tests or implementation were added.

At the human's request, summarized the production import follow-up directly in DECISIONS.md and retained the detailed research link. Documentation only; no application tests run.

The human confirmed that products absent from a snapshot are assumed unavailable but their data is retained; UI presentation and filtering remain deferred. Validating the full input and applying the snapshot transactionally were accepted. Review preservation will be verified when reviews exist. No implementation or tests performed.

## 2026-11-02 — First import test batch for review

Added initial Jest examples for snapshot normalization, duplicate selection and diagnostics, unknown values, and invalid files. The tests propose a parsing boundary; database snapshot application, timestamps, repeat imports and future review preservation need subsequent integration coverage. The focused Jest invocation fails during module resolution because the importer does not yet exist (zero tests execute); this is not evidence that the examples pass or fail against an implementation. Prettier check passes for the test file. Awaiting human review before implementing.

Fixed the API editor TypeScript project to include spec files and Jest types, while keeping production builds Node-only and excluding specs. `npx tsc --noEmit -p apps/api/tsconfig.json` now reports only the expected missing importer; `npm run build -w @product-finder/api` passes. Test cases still cannot execute before the importer exists.

Reviewed the proposed import coverage against the agreed behavior and existing examples. Presented an expanded behavior list for human review, including snapshot lifecycle and diagnostic gaps; no test code or implementation changed and no tests run. Proposed runtime budget is unmeasured until implemented.

## 2026-11-03 — Import tests implemented ahead of the importer

Expanded the Jest snapshot cases and added an isolated PostgreSQL/seed integration suite for the human-reviewed list. The test-only proposed interfaces are `parseCatalogueSnapshot`, `importCatalogue`, `runSeed`, an npm `db:seed` command and a Prisma `Product` model; they do not yet exist and may need adjustment to the implementation. Integration tests refuse nonlocal/non-test database URLs, create a uniquely named schema, run migrations within it and clean up only that schema. Review-preservation coverage remains deferred until the review model exists.

Verification: focused unit and integration Jest commands both stop at the missing importer module before executing any cases; the integration setup therefore did not touch a database. ESLint and Prettier checks for both files pass. TypeScript reports only the missing importer and seed modules. Runtime of actual test cases and migration/seed behavior remains unverified.

## 2026-11-03 — Catalogue snapshot import

Committed the reviewed test suites and editor configuration as `ff8f05f`. Implemented the Product schema and checked-in migration, strict CSV normalization and duplicate diagnostics, and a manual seed. Parsing finishes before a transaction; a PostgreSQL table lock serializes imports, and set-based operations apply the snapshot while preserving identity, presence history and the agreed timestamps. The seed defaults to the supplied file and reports input, conflict and outcome counts. README documents migration, seed, custom file paths and the complete-snapshot assumption.

The first integration run exposed timezone interpretation of timestamps; changed product timestamps to PostgreSQL timestamptz and reran the suite. Added a test ensuring an all-empty CSV record is rejected rather than skipped. Focused parser suite: 48 tests pass in 0.471 s. Isolated PostgreSQL integration: 13 tests pass across two suites in 3.012 s, including a deferred commit failure and rollback. `npm run check` passes lint, formatting, 60 unit tests across both apps and both builds. Separately ran root migration and default seed twice in a newly created isolated test schema: 202 rows yielded 200 products; first run created 200 and second reported 200 unchanged. The schema was removed; no development data was modified. Review preservation remains unverified until reviews are implemented. The import slice awaits human review.

## 2026-11-03 — Seed diagnostics

Grouped console warnings by type, showing up to three concise examples and an omitted count. Interactive stderr uses yellow unless NO_COLOR is set; redirected output remains plain. Each seed attempt creates an ignored per-run log under `logs/` by default, with full diagnostic details and fatal errors; `IMPORT_LOG_DIR` overrides its directory. A log creation failure stops before import; if the final log write fails after commit, the command explicitly reports that the database change already completed. README documents these semantics.

Verification: `npm run check` passed lint, formatting, 60 unit tests and both builds. `npm run test:integration` passed 16 tests in 2.769 s, including warning limits by category, color, full log contents, fatal error logs and refusal to import when a log cannot be created. Test logs were isolated in a temporary directory and removed. README changed after the full check to clarify the post-commit log failure case.

## 2026-11-03 — Catalogue browsing planning

Started [the catalogue browsing working plan](catalogue/catalogue-browsing-plan.md), covering PrimeNG default building blocks, product design and technical decisions still open, and representative proposed behavior. Inspected installed PrimeNG public types and official component documentation. Planning only; no tests run and no slice behavior approved or implemented.

Added a proposed end-to-end browsing sequence to the working plan, from Angular through NestJS and PostgreSQL, including validation, results, empty and failure states. A brand reference is expected later; no visual design or feature implementation was performed. No tests run.

Inspected the supplied brand-reference ZIP: it contains a secondary guidance README and example CSS tokens, with no logos or font files. Updated the working plan to distinguish corporate colors from suggested UI tokens, note accessibility and authorization constraints, and leave theme and layout choices open. Archive left intact; no application changes or tests.

Inspected the replacement brand archive and its nested ZIPs. It adds six 1181×591 CMYK JPEG logo variants and a 16:9 PowerPoint template; visual inspection shows white lockups on colored rectangles, while the reference describes them as intended for white backgrounds. Updated the plan to flag intended use and digital suitability for discussion. No assets applied; no tests run.

Checked the human-provided official BASF font page. It allows Roboto for digital applications and links a Roboto archive; it requests the static version, restricts variable and condensed variants, and restricts Arial outside office/Microsoft contexts. Updated the working plan; the ZIP content was not inspected and no font was installed. No tests run.

Generated three ImageGen concept boards for desktop/mobile catalogue layout, search, product results and availability indicators. They illustrate compact table/list, bordered cards and structured rows using the supplied brand direction; generated copy and controls are illustrative. No visual design has been selected or implemented.

The human chose accessible automatic incremental result loading and requested a revised design. Generated one desktop/mobile ImageGen concept with an in-flow loading indicator and an illustrative manual next-batch fallback. Updated the browsing plan; detailed interaction and implementation remain open. No feature code or tests changed.

Generated a three-screen mobile exploration for the human's proposed filter/sort drawer, horizontally scrolling selection pills and full-screen search with recent searches. The illustration uses placeholder product and filter data; detailed behavior and scope remain to be discussed. No application code or tests changed.

Copied the latest generated mobile concept to `docs/agent/catalogue-mobile-design-reference.png` and linked it from the browsing plan as a visual reference, not an implemented specification. No application code changed; no tests run.

Copied the desktop design reference (which also shows an earlier mobile concept) into `docs/agent/` and linked it in the browsing plan. Documentation only; no tests run.

Replaced the composite desktop reference with an ImageGen desktop-only rendering of the same concept. The human identified excess visual noise and primary-color use; hierarchy refinements remain under discussion. No application code or tests changed.

Updated the desktop design reference with an ImageGen revision exploring neutral row typography, less repeated color, restrained status labels and an illustrative whole-row hover state. Awaiting human review; no application behavior or tests changed.

Removed invented navigation links from the desktop reference and the corresponding empty hamburger from the mobile reference; the full-screen search back control remains. Confirmed no frontend routes currently exist. No application code or tests changed.

Revised the mobile design reference to align product-row hierarchy and status colors with the desktop concept. The generated image remains illustrative, including inconsistent example filter/result data; no feature implementation or tests changed.

Recorded that design images are non-pixel-perfect references and that implementation should favor existing PrimeNG components and behavior, using the images to guide gaps in component or layout coverage. Documentation only; no tests run.

Recorded agreed sharing direction for catalogue and product views and the human's desire for individually shareable reviews, while leaving review interaction and exact shared scroll restoration open. Added a proposed frontend architecture and testing boundaries to the browsing working plan. Discussion only; no application code or tests changed.

Outlined proposed frontend Jest integration/unit and isolated Playwright coverage in the browsing plan, including URL state, loading, request races and mobile interaction, with detail/review cases deferred. Discussion only; no tests implemented or run.

Expanded the proposed browsing coverage in [catalogue-browsing-tests.md](catalogue/catalogue-browsing-tests.md): frontend state/component/router behavior, API validation and responses, real database search/filter/sort/batch semantics and five real-stack browser journeys. Marked unresolved contract decisions and conditional recent-search/detail/review cases; included duplication and runtime limits. Documentation only; no tests implemented or run.

Recorded deferred browsing tests in TODO.md and prepared the browsing plan, behavior list and image references for a plan commit. The human requested test implementation after that commit; product behavior and API details that remain open must not be presented as approved. No test code or application feature was added in the plan commit.

The human selected initial catalogue rules during test-first work: trimmed case-insensitive substring search on name/SKU; all products present in the latest import visible with their status; status and application-area filters. Updated the working plan and test assumptions. Filter combinations, sorting, absent-product controls and the exact API contract remain open.

The human selected OR within filter groups and AND between groups; name A–Z/Z–A with unnamed products last and SKU tie-breaks; and a separate not-in-latest-import option. The precise absent-option behavior, search submission and recent-search scope remain under discussion.

The human revised availability presentation: group absent products with unavailable/unknown products under an unavailable UI category while retaining source status and import presence separately. The human selected debounced automatic desktop search, confirmed mobile search and local recent searches in this slice. Exact status mapping and history behavior remain under discussion.

Clarified availability: unavailable means unknown or absent, with discontinued separate; absence takes precedence in display while source status and presence stay independent. Recent search history should include committed searches from both views locally. Browser history behavior remains under discussion.

The human selected one browser-history entry when a desktop search is committed by Enter or leaving the field, with results updating automatically after a typing pause. Back should restore the previous committed view.

The human subsequently removed recent-search storage from this slice and chose to defer it. Invalid shared-URL filter/sort values should be ignored with a short warning and defaults; mobile drawer edits apply explicitly and are discarded on dismissal. Updated plans and test scope.

Implemented a test-first browsing batch: frontend component/router/state examples, NestJS HTTP against an isolated migrated PostgreSQL schema, and five Playwright journeys using a uniquely named temporary database and dynamically allocated local ports. Added Playwright/Chromium setup, `npm run test:e2e`, CI wiring and README instructions. Tests use a provisional `/api/products` offset/response contract documented in catalogue-browsing-tests.md; no product browsing feature was implemented.

Verification before the final documentation update: frontend browsing Jest ran 19 cases (18 fail at the missing catalogue request, one no-invented-navigation case passes); API/PostgreSQL browsing Jest ran 28 cases (all fail because the product endpoint is 404); Playwright ran five journeys (all fail at the missing product list). These early failures mean subsequent assertions have not been exercised or validated. The API browsing suite took 2.986 s and frontend browsing suite 2.52 s in those runs; the browser failure run took about 15 s of case time, plus setup. `npm run test:e2e -- --list` subsequently started/migrated/seeded its isolated stack and discovered five journeys; unique browser-test databases were verified removed. Existing API Jest (59), frontend shell Jest (1), import/readiness integration (16), production builds, lint, formatting and test type checks passed. The web test type check required bundler module-resolution overrides because the existing Jest tsconfig uses legacy Node resolution. Later browser-test assertion edits were syntax/lint checked but cannot be exercised past the missing screen. Hosted CI and final passing runtimes remain unverified.

After the initial browser run, expanded the fixture to 120 synthetic products across active, phase-out and discontinued statuses, and corrected the share/history examples so both products match the selected Food/discontinued criteria. Re-ran `npm run test:e2e -- --list`: the isolated stack started and all five cases were discovered. Re-ran lint, formatting and API/web test type checks; all passed. Playwright assertions after the initial product-list check remain unexercised because the screen is absent. The fixture assumes the eventual default batch size is less than 120; revisit that fixture when the batch contract is agreed.

Committed the agreed browsing tests and supporting decisions as `935ba13`. Implemented `GET /api/products` with validated bounded offset batches, literal case-insensitive name/SKU search, availability and application-area filters, stable ordering, totals and available application areas. Implemented the responsive Angular catalogue, committed URL state, debounced desktop search, confirmed mobile search, filter/sort drafts, accessible manual loading/retry and automatic incremental loading. Details/reviews and recent searches remain deferred. API state retains source status and import presence separately. Product rows do not link to nonexistent details.

Local verification: `npm run test:integration` passed 44 cases (including 28 browsing cases); `npm run check` passed lint, formatting, 59 API and 21 frontend Jest cases and production builds. The Angular build warns that the initial bundle is 591.77 kB against its 500 kB warning budget. Five isolated Playwright journeys passed after implementation. A temporary additional Playwright capture produced desktop (1280px), mobile (390px) and drawer screenshots; inspected them and aligned the PrimeNG primary action color with the blue direction. Temporary capture test was removed. No formal screen-reader, zoom or 50,000-product performance review was performed. Human review remains pending. An accidental direct API integration invocation used the development URL and was rejected by the existing test-database guard before data access; the subsequent root runner used the isolated database.

The human reported the dev app could not load at the machine’s Tailscale hostname on port 4200. The Angular server was bound to loopback and rejected the tailnet Host header with HTTP 403; the local browser and `/api/products` worked. Added opt-in `npm run dev:tailnet` using the Tailscale IPv4 interface and Angular’s host allowance, leaving local dev unchanged. Verified a separate Angular process on port 4242: tailnet hostname page and proxied product API returned HTTP 200, and headless Chromium rendered 30 products over that hostname. The human must restart the current dev process with the new command; end-to-end access from their device remains to be confirmed.

Committed the first catalogue implementation as 8f87078 and added design-focused Playwright tests before the requested UI corrections; the test commit was amended to 6dfc783 after fixing a test that inspected a transparent inner label instead of the PrimeNG tag host. Implemented the supplied unchanged BASF logo, equal-width neutral mobile buttons with icons, neutral/phase-out/discontinued status styling, and filter/sort panel header and footer pinned around a scrolling content area. Closing discards drafts; reset affects drafts; Apply shows selected filter value count or one selected sort. Human review of design and sort-count assumption remains pending. The supplied logo is a CMYK raster; confirm a suitable authorized digital asset before use beyond the take-home.

Final local browser verification after the design corrections: all nine Playwright cases passed, including the new panel, toolbar, logo and tag checks. `npm run check` passed after the main UI change; the production build retained its existing initial-bundle warning. Inspected a mobile screenshot and panel with representative products. The already-running tailnet Angular watcher picked up the markup and styles but did not pick up the new static-assets configuration, so its logo request failed; restart `npm run dev:tailnet` to load the logo for human inspection. Formal screen-reader and logo-licensing checks remain open.

The human subsequently reported a broken logo and provided a screenshot. The running tailnet server was checked and now returns `basf-logo.jpg` as a complete JPEG with HTTP 200; the earlier failure on the human’s device has not been reproduced or confirmed resolved. The supplied asset is a CMYK JPEG, so device/browser decoding remains a possible cause to investigate.

Following human review, converted the supplied logo from embedded CMYK to sRGB PNG and matched the header to the converted background. Active search and non-default sort now have removable PrimeNG button pills, styled pale blue alongside filter pills. Added browser coverage for search removal preserving filters, sort reset and matching logo/header colors. Inspected a mobile browser screenshot using the running tailnet app. The earlier shared-link test needed a more specific Sort selector after adding the sort-removal button. User-device color rendering remains to be confirmed.

Aligned the filter/sort panel title beside the close button by giving the shared heading the available space on its right; reset remains on the right.

Moved the mobile search hint into the input placeholder and placed the close button alongside it; retained a visually hidden label for assistive technology.

Aligned the Product Finder header title to the right of the header content area, opposite the BASF logo. Inspected the running app in Chromium at 390px and 1280px; human review is pending.

Adjusted the title's right inset to match the approximately 15px of background built into the left side of the displayed logo.

Removed the desktop search timer; Enter or blur now applies the search, while mobile still requires confirmation. The new no-request-after-pause Jest test first failed against the timer implementation, then passed after its removal. Updated the browser sharing journey, which had expected results before blur. `npm run check` passed (59 API and 22 frontend Jest tests, lint, format and builds); the existing Angular bundle warning remains. All 12 Playwright tests passed. A Chromium check against the running development app confirmed results remain unchanged after a pause and update on Enter. Human review is pending.

Implemented the selected left-aligned no-results design. Clear filters removes search and status/application filters while retaining sort; search alone offers Clear search. Jest covers filter-only and combined criteria, URL and sort preservation. `npm run check` passed (59 API and 24 frontend tests, lint, formatting and builds), with the existing Angular bundle warning; all 12 Playwright tests passed. Inspected mobile and desktop Chromium views and exercised Clear filters in both. Human review is pending.

## 2026-11-03 — Import test review and tightening

Reviewed the import parser, seed script and test suites at the human's request, then tightened the unit and integration tests without modifying the implementation. Added zero-warning assertions for valid inputs and expected unknown years (`''`, `'n/a'`, `'N/A'`), specific diagnostic-type/reason assertions, coverage for all six nullable text columns, outcome-count assertions across consecutive absences and returning products, exact three-warning console truncation boundary coverage, missing `DATABASE_URL` coverage and a post-commit log write failure test. Added unit cases for four-digit year validation (`-2020`, `0`, `99`, `+2020`, `10000`), 32-bit `INT4` overflow (`3000000000`, `-3000000000`), rejecting unknown extra CSV headers, and tie-breaking when a third duplicate row matches an earlier winning row after a conflict.

Verification: `npm run test:integration -- catalogue-import.integration-spec.ts` passed all 16 cases in 2.469 s. `npm test -w @product-finder/api -- catalogue-import.spec.ts` ran 58 cases: 51 passed and 7 failed against the intentionally unadjusted implementation (5 non-four-digit/signed launch year cases, 1 unknown-header case, and 1 three-row conflicting duplicate tie-break case). ESLint, Prettier check and API TypeScript check passed.

## 2026-11-03 — Tighten catalogue browsing tests and expose implementation gaps

Reviewed the catalogue browsing feature and test suites end-to-end and tightened assertions across frontend Jest (`apps/web/src/app/catalogue-browsing.spec.ts`), API PostgreSQL integration (`apps/api/test/catalogue-browsing.integration-spec.ts`), and Playwright E2E (`tests/e2e/catalogue-browsing.spec.ts`, `tests/e2e/catalogue-design.spec.ts`, `scripts/run-browser-tests.mjs`), without modifying application implementation code as directed.

Verification:
- `npm run lint` and `npm run format:check` pass.
- Frontend Jest (`npm test -w @product-finder/web`): 26 passed, 4 failed (30 total). The 4 failing cases expose unimplemented frontend behaviors: cleaning unknown `applicationArea` values from the URL after fallback, deduplicating repeated filter query parameters, avoiding a redundant draft search commit when blurring the desktop input to click the remove-search pill, and exposing `aria-expanded` on drawer triggers plus an accurate backdrop label when sorting.
- Backend PostgreSQL integration (`npm run test:integration -- catalogue-browsing.integration-spec.ts`): 40 passed, 2 failed (42 total in `catalogue-browsing.integration-spec.ts`). The 2 failing cases expose case-sensitive byte-order sorting on product names (`'acorn'` sorted after `'Beta'`) and missing maximum-length validation on `search`.
- Playwright E2E (`npm run test:e2e`): all 12 tightened browser journeys pass in 13.5 s, including multi-match filter/sort/share ordering, isolated manual batch loading with `IntersectionObserver` disabled, forward/backward dialog focus trapping, post-retry automatic continuation recovery, and `UNKNOWN` plus absent-product (`presentInLatestImport = false` overriding `DISCONTINUED`) status display.

## 2026-11-03 — Address adversarial test findings

Committed the hardened tests and their review notes as `0ec7f98`. Updated import validation to require the expected headers and a four-digit year, and keep later duplicate rows flagged as conflicts after a conflicting SKU has been encountered. Updated catalogue handling to deduplicate URL filters, remove invalid application areas from the URL, expose drawer state to assistive technology, and avoid applying a draft search when its active search chip is clicked. Name sorting now compares lowercase names in PostgreSQL with SKU as a stable tie-breaker; search is limited to 200 characters. The list query uses parameterized SQL for sorting while the count uses Prisma filters, so changes to filter semantics must keep both paths consistent. Adapted the isolated-schema integration fixture and added a real-browser search-chip regression.

Verification: `npm run check` passed (69 API and 30 frontend unit tests, lint, formatting and builds); the existing Angular bundle-budget warning remains. All 59 PostgreSQL integration tests and 13 Playwright tests passed. Import header and year rules are assumptions to confirm with the PIM owner; review by the human remains pending.

## 2026-11-03 — Architectural review for discussion

Added the requested narrative architectural review to the existing human milestone document, preserving its prior notes. Cross-checked import transactions, migration, query behavior and Angular state ownership against source. Updated the documentation entry point and continuation guidance to reflect the human's explicit use of the previously reserved folder. Documentation only; no runtime changes or new test runs.

## 2026-11-03 — Future code review criteria

Added [deferred review criteria](code-review.md) covering frontend/backend readability, responsibilities, duplication, correctness and verification, with a suggested bounded workflow. Linked from the documentation index and backlog. Documentation only; no application tests run.

## 2026-11-03 — Product details scope proposal

Recorded the v0.2.0 target delivery checklist and phase 1 proposal in [product-details-plan.md](product-details/product-details-plan.md), linked from the backlog and documentation index. Inspected assignment, browsing agreements and product schema to ground the proposal. Scope is pending discussion. Documentation only; no application tests run.

## 2026-11-03 — Narrowed slice boundaries

Updated the product details plan and backlog; saved filter/sort planning inputs in catalogue-filter-sort-follow-up.md for the following slice. Documentation only; no application tests run.

## 2026-11-03 — Consolidated phase 1 understanding

Reconciled the product-details plan with the behavioral agreements and acceptance examples. Phase 1 awaits human review; phase 2 and implementation have not started. Documentation-only verification: git diff --check; no application tests run.

## 2026-11-04 — Design references and documentation organization

Saved seven ImageGen boards under product-details/references and linked them from the product details plan. Grouped related agent documents under catalogue, brand and product-details; updated affected links. Documentation and images only; no application tests run.

## 2026-11-04 — Product details architectural proposal

The human reviewed the phase 1 understanding and requested phase 2. Inspected catalogue URL state, route setup, list API, import identity, Prisma schema and nginx deep-link fallback. Recorded proposed API, identity, navigation, criteria, sharing and verification boundaries in the product details plan. The human confirmed that links only need to survive normal imports, supporting the proposed UUID identity. Documentation only; no application tests run.

## 2026-11-04 — Product details test-first work

The human requested proceeding to the next phase. Added an initial PostgreSQL API contract batch and desktop/mobile Playwright journeys for product navigation, recovery, unavailable/missing fields and sharing. Against the unimplemented app, the targeted PostgreSQL suite had 42 passes and 8 failures (missing list identity and details endpoint); the malformed/missing ID check passes because no detail route exists, so it does not yet establish validation. The initial browser run failed all 9 collected tests, consistent with missing product routes, links and sharing controls. A copy-success browser test was added after that run and has not been run. ESLint passed for the test files. No product implementation was changed. Phase 3 remains open: strengthen request race, criteria normalization, product sharing and related coverage before adversarial review.

## 2026-11-04 — Complete phase 3 test batch

The human requested finishing phase 3. Expanded PostgreSQL tests for detail data, dependency failures and identity over absent/returning imports; expanded browser tests for product sharing, native-share and clipboard mocks, draft criteria, invalid parameters, retained/unknown states, loading, stale responses and multi-batch return. Targeted PostgreSQL integration: 42 passed, 11 failed out of 53 against the unimplemented endpoint and list identity. The complete browser baseline collected 21 tests, all failing against missing product routes and sharing controls. A subsequent synchronization adjustment to the stale-response test has not been dynamically exercised. Test files pass ESLint, Prettier and standalone TypeScript checking. No application implementation was changed. Phase 4 must independently review test coverage and reliability; unexecuted assertions and real device/assistive-technology behavior remain limitations.

## 2026-11-04 — Phase 4 adversarial review of product-details tests

Reviewed the phase 3 test batch against [product-details-plan.md](product-details/product-details-plan.md) and [testing-strategy.md](testing-strategy.md), then tightened and expanded PostgreSQL integration, Frontend Jest, and Playwright E2E suites without modifying application implementation code:

- **Resolved Frontend Jest contradiction and missing boundary (`apps/web/src/app/catalogue-browsing.spec.ts`, `apps/web/src/app/product-details.spec.ts`):** Updated `catalogue-browsing.spec.ts` where `expect(root().querySelectorAll('.products a')).toHaveLength(0)` directly contradicted v0.2.0 whole-row links and sample fixtures lacked `id`. Added `apps/web/src/app/product-details.spec.ts` (27 cases) covering whole-row links, customer-facing fields without UUID/timestamp/review-placeholder leakage, heading focus placement, missing/unnamed fallbacks (exact 6-count `"Not provided"` + `"None listed"`), all 8 status × import-presence availability combinations, XSS markup escaping, property-based criteria round-trip invariants and malformed URL normalization (`search > 200`, repeated scalar `search`/`sort`, whitespace-only `applicationArea`, candidate `applicationArea` preservation across 200/404/503 detail responses), stale-request concurrency, duplicate-retry click guards, and API/clipboard/Web Share fault injection.
- **Hardened PostgreSQL integration (`apps/api/test/catalogue-browsing.integration-spec.ts`):** Eliminated the vacuous 404 pass by asserting domain 404 (not NestJS's default `Cannot GET` route-missing response) and inserting a synthetic non-UUID `TEXT` primary key plus 30+ property-generated and edge-case malformed identities; added uppercase/mixed-case UUID lookup coverage against the `TEXT` primary key; tested `applicationArea: null`, multi-certification ordering, exact 12-key schema checks on all detail responses, and lookup independence from invalid catalogue query parameters; added a concurrency test running parallel `GET /api/products/:id` and `GET /api/products` reads alongside `importCatalogue` snapshot updates; and injected Prisma-specific infrastructure failures (`P1001`, `PrismaClientInitializationError`) alongside generic errors.
- **Hardened Playwright E2E (`tests/e2e/product-details.spec.ts`, `scripts/run-browser-tests.mjs`):** Added `pageerror` listeners on primary and recipient pages; enriched the isolated PostgreSQL fixture with deterministic UUIDs and complete customer-facing/missing-value records so E2E journeys hit real PostgreSQL data instead of `page.route` mocks for detail fields, missing values, unknown status and absent products; added whole-row anchor geometry, heading focus, deep-link logo rendering and horizontal-overflow checks; verified both `Back to catalogue` and Browser Back (`page.goBack()`) after scrolling multiple batches reset `window.scrollY` to `0` and batch count to one batch; and verified clipboard failure feedback without false success claims plus hidden native `Share` when `navigator.share` is unsupported.

Verification (against the unimplemented v0.2.0 slice):
- `npm run format:check`, `npm run lint`, and API/web TypeScript checks pass.
- API unit tests (`npm test -w @product-finder/api`): 69 passed (69 total).
- Frontend Jest (`npm test -w @product-finder/web`): 29 passed, 28 failed (57 total: 1 in `catalogue-browsing.spec.ts` for missing row links and 27 in `product-details.spec.ts`, including 4 failing directly on the existing catalogue route for unnormalized oversized search, repeated scalar parameters, and whitespace-only `applicationArea`).
- PostgreSQL integration (`npm run test:integration`): 58 passed, 16 failed (74 total across 3 suites; all 17 v0.2.0 cases in `catalogue-browsing.integration-spec.ts` now fail as expected with zero vacuous passes, except `includes the product identity` and `returns a bounded summary` which fail on the missing list `id`).
- Playwright E2E (`npm run test:e2e`): all 13 existing catalogue browsing and design journeys pass in 13.6 s against the updated fixture; all 21 hardened `product-details.spec.ts` journeys fail at the expected missing routes/controls.

## 2026-11-04 — Phase 5 product-details implementation

Implemented the v0.2.0 product details, sharing, and navigation slice to satisfy all requirements and pass all tests:

- **Backend API (`apps/api/src/products.controller.ts`):**
  - Added `id` selection to `GET /api/products` catalogue list query.
  - Added `GET /api/products/:id` selecting the exact agreed 12 customer-facing and availability fields (`id`, `sku`, `name`, `chemicalName`, `function`, `applicationArea`, `region`, `certifications`, `status`, `launchYear`, `description`, `presentInLatestImport`).
  - Added UUID regex validation returning domain 404 for malformed/non-UUID primary keys or missing records. Normalized UUIDs to lowercase to support uppercase and mixed-case client representations.
  - Retained generic 5xx server errors for database/infrastructure failures (P1001, Prisma initialization errors, connection loss) without leaking SQL, passwords, or Prisma internals.

- **Frontend Routing and Architecture (`apps/web/src/app/`):**
  - Converted `App` (`apps/web/src/app/app.ts`, `app.html`, `app.scss`) into the common application shell containing the BASF header and `<router-outlet>`.
  - Extracted `CatalogueComponent` (`apps/web/src/app/catalogue/`) from `App`, keeping search, filter, sort, drawer states, and infinite scrolling.
  - Configured Angular Router (`apps/web/src/app/app.routes.ts`) with `''` for `CatalogueComponent`, `'products/:id'` for `ProductDetailsComponent`, and `'**'` redirecting to `''`.
  - Added `apps/web/src/app/criteria.ts` with shared criteria normalization and serialization helpers. Handles oversized `search > 200`, repeated scalar parameters (`search`, `sort`), whitespace-only `applicationArea`, and invalid `status`/`sort` values with warning notifications. Preserves candidate application areas in detail return links for catalogue data validation.

- **Product Details & Accessibility (`apps/web/src/app/product-details/`):**
  - Built `ProductDetailsComponent` (`product-details.ts`, `product-details.html`, `product-details.scss`) fetching `/api/products/:id` with loading state (`[aria-busy="true"], [role="status"]`), 404 Product Not Found view (without Retry), and temporary service failure alert (with single in-flight duplicate-click guarded Retry).
  - Placed focus on the `<h1>` heading on successful load and 404 error states.
  - Rendered all customer-facing fields with exact agreed fallback texts: SKU heading fallback when unnamed, exact 6-count `"Not provided"` for missing nullable scalar fields, and `"None listed"` for empty certifications.
  - Enforced availability precedence: `presentInLatestImport === false` takes precedence over source status with the absent explanation; `status === 'UNKNOWN'` explains unconfirmed availability; valid statuses display appropriate badges without inventory/stock assertions.
  - Immediately clears previous product details upon route navigation, cancelling in-flight requests and ignoring obsolete late responses or errors.

- **Sharing and Navigation Fallback:**
  - Implemented whole-row links covering item geometry in catalogue rows. Back to catalogue and Browser Back preserve carried criteria, reset scroll position (`window.scrollY = 0`), and start at the top with a single batch.
  - Feature-detected `navigator.share`, showing native Share only when supported and ignoring cancellations (`AbortError`) without false copy success claims.
  - Implemented Copy Link with success feedback banner and fallback to an accessible readonly textbox with failure feedback when clipboard write permissions fail or clipboard API is unavailable.

Verification evidence:
- `npm run lint` and `npm run format:check` pass with 0 errors.
- API unit tests (`npm test -w @product-finder/api`): 69 passed (69 total).
- Frontend Jest (`npm test -w @product-finder/web`): 57 passed (57 total across `app.spec.ts`, `catalogue-browsing.spec.ts`, and `product-details.spec.ts`).
- PostgreSQL integration (`npm run test:integration`): 74 passed across 3 suites (`catalogue-browsing.integration-spec.ts`, `catalogue-import.integration-spec.ts`, `health.integration-spec.ts`).
- Playwright E2E (`npm run test:e2e`): all 34 browser tests pass across desktop and mobile viewports in 30.5 s (`catalogue-browsing.spec.ts`, `catalogue-design.spec.ts`, `product-details.spec.ts`).
- `npm run check` passes lint, format check, all unit tests, and production builds for both apps. No git commit made.

## 2026-11-04 — Phase 6 adversarial review of product-details implementation

Reviewed the phase 5 implementation (`edd8c62` and `59b2b59`) across backend and frontend against [product-details-plan.md](product-details/product-details-plan.md), the visual reference boards (`docs/agent/product-details/references/`), and [code-review.md](code-review.md). Recorded 6 concrete defects and 3 maintainability/duplication findings in [product-details-plan.md](product-details/product-details-plan.md):

- **Concrete defects:**
  1. Missing heading and focus placement on `ProductDetailsComponent` service-error states (`503`/network failures lack an `<h1>` focus target and never set `shouldFocusHeading`) and on `CatalogueComponent` when returning via `Back to catalogue` or Browser Back (focus drops to `document.body`).
  2. Invalid-criteria warning state leak via `history.state` (`CatalogueComponent` reads `location.getState().warning` / `history.state.warning` on every `queryParamMap` emission without clearing it, while `ProductDetailsComponent` computes `hasWarning` without rendering a banner and strips invalid params before `Back to catalogue`, losing warnings on middle-click/new-tab opens).
  3. Stale clipboard/share feedback (`copiedMessage`, `copyFailed`, `manualLink`) across `queryParamMap` changes in both `CatalogueComponent` and `ProductDetailsComponent`, plus unguarded async `navigator.clipboard.writeText(url)` completion.
  4. `Share` and `Copy link` controls rendered unconditionally on `ProductDetailsComponent` during loading, 404, and 503 states, and missing the in-card `Back to catalogue` recovery action shown in `references/not-found.png` and `references/service-error.png`.
  5. Mobile toolbar crowding in `CatalogueComponent` (`Share` and `Copy link` placed inside the single-row `.toolbar` with `flex: 1 1 0`, squeezing up to 5 buttons into one row below `600px` instead of wrapping onto a secondary row as in `references/catalogue.png`) and hard `minmax(18rem, 1fr)` grid minimum on `.product-properties`.
  6. Wildcard route `{ path: '**', redirectTo: '' }` in `app.routes.ts` silently redirecting unknown/multi-segment paths to `/` instead of showing a not-found state.
- **Maintainability & duplication:**
  7. Near-verbatim duplication of share/clipboard state, methods, and fallback UI across `CatalogueComponent` and `ProductDetailsComponent`.
  8. Customer-facing availability helpers split between `criteria.ts` (`statusLabel`, `statusSeverity`) and `ProductDetailsComponent` (`isUnavailable`).
  9. Redundant `this.router.initialNavigation()` in `App.constructor()`, uncleaned `router.events` subscription in `App`, and `@for (...; track product.sku)` instead of `track product.id` in `catalogue.html`.

Documentation-only review phase; no application code modified. Phase 7 (address implementation review findings) is next.

## 2026-11-04 — Phase 7 address implementation review findings

Addressed all 9 concrete findings from Phase 6 across frontend code and templates:

- **Focus management on service errors and catalogue return:**
  - Added `<h1 #heading tabindex="-1">Unable to load product</h1>` in `ProductDetailsComponent` error block and set `this.shouldFocusHeading = true` on non-404 error responses.
  - Added `#heading tabindex="-1"` to `CatalogueComponent`'s `<h1>Products</h1>` and focused it upon return from product details (via `state.fromDetail` or router navigation).
- **Warning state leak prevention:**
  - Added invalid-criteria warning banner to `ProductDetailsComponent` when `hasWarning` is true.
  - Consumed transient `locationState.warning` on initial read in `CatalogueComponent` and cleared it via `location.replaceState` so that invalid-criteria warnings do not stick across subsequent valid user interactions.
  - Carried `warning: true` in `backState` only when `hasWarning` is true.
- **Share & clipboard feedback hygiene:**
  - Extracted `ShareController` (`apps/web/src/app/sharing.ts`) managing native share, clipboard async calls, generation counters, and component lifecycle guards.
  - Reset `copiedMessage`, `copyFailed`, and `manualLink` on criteria commits and `queryParamMap` updates across both catalogue and detail components.
- **Sharing controls in loading/error states & recovery links:**
  - Guarded `.detail-nav` with `@if (product)` so sharing controls only appear on loaded products.
  - Rendered recovery `Back to catalogue` link in both 404 Not Found and 503/error views.
- **Mobile toolbar crowding and grid minimums:**
  - Grouped `Share` and `Copy link` into `.toolbar-actions` wrapping cleanly onto a secondary row on mobile viewports (`max-width: 600px`), keeping `Search`, `Filters`, and `Sort` equal width on the top row.
  - Updated `ProductDetailsComponent` `.product-properties` grid to `minmax(min(100%, 18rem), 1fr)`.
- **Wildcard route unknown-path handling:**
  - Pointed `{ path: '**', component: ProductDetailsComponent }` so invalid or multi-segment paths render 404 Not Found while preserving valid carried criteria instead of silently redirecting to root.
  - Guarded `loadProduct()` in `ProductDetailsComponent` so an empty id immediately sets `notFound = true` without querying `/api/products/`.
- **Duplicated share logic extraction:**
  - Reused `ShareController` in both `CatalogueComponent` and `ProductDetailsComponent`.
- **Availability presentation helpers:**
  - Consolidated `availabilityExplanation()` and `isUnavailable()` in `apps/web/src/app/criteria.ts` alongside `statusLabel()`, `displayStatus()`, and `statusSeverity()`.
- **Router subscription cleanup and catalogue track key:**
  - Added `takeUntilDestroyed(this.destroyRef)` to `App` router event subscription.
  - Tracked catalogue items by `product.id` rather than `product.sku`.

Verification evidence:
- `npm run check`: 69 API unit tests pass, 57 frontend Jest tests pass, lint and Prettier pass, NestJS and Angular production builds pass.
- `npm run test:integration`: 74 integration tests against PostgreSQL pass.
- `npm run test:e2e`: 34 Playwright E2E tests pass across desktop (1280px) and mobile (390px). Phase 8 (human behavioral review and click-through) is next. No git commit made.

## 2026-11-04 — Phase 8 human review and click-through corrections

Addressed human review feedback from testing:
- **Dismiss manual copy notice:** Added dismiss button and header close icon to `.share-fallback` in both `CatalogueComponent` and `ProductDetailsComponent`. Wired to `dismissManualCopy()` / `ShareController.dismissFallback()` to cleanly dismiss the notice and text field.
- **Button labels for catalogue vs product:** Updated catalogue toolbar buttons to "Share results" and "Copy link to results". Retained "Share" and "Copy link" on `ProductDetailsComponent`.
- **Dismiss success notification:** Added dismiss button (`✕` / `aria-label="Dismiss notification"`) to the `.status-banner.success` element on both `CatalogueComponent` and `ProductDetailsComponent`, wired via `dismissCopiedMessage()` to `ShareController.dismissSuccess()`.
- **Verified tests:** Updated unit and Playwright tests to cover dismissal of the manual copy fallback, dismissal of the success banner, and the updated button labels. All 69 API unit, 58 frontend Jest, 74 PostgreSQL integration, and 34 Playwright E2E tests pass.
- **Local HTTPS script:** Added `npm run dev:ssl` to root and web workspaces (`--ssl --host 0.0.0.0 --allowed-hosts`) and documented its purpose for mobile Web Share testing in root `README.md`.

## 2026-11-04 — Phase 10 & 11 final adversarial review and fixes for product-details (v0.2.0)

Completed Phase 10 (final adversarial review for gaps after human review) and Phase 11 (final implementation and verification):

- **Phase 10 findings & Phase 11 fixes:**
  1. **Desktop search `mousedown` -> `blur` race (`apps/web/src/app/catalogue/catalogue.ts`, `apps/web/src/app/catalogue/catalogue.html`):** When `#desktop-search` had focus with an uncommitted draft, `mousedown` on `.product-link` or `"Share results"` / `"Copy link to results"` fired `blur` on `#desktop-search` before `mouseup`/`click`, causing `scheduleSearchCommit()` to wipe `this.products = []` during `mousedown` (swallowing the product row click) or commit the draft before share/copy ran. Added `suppressNextBlurCommit()` on `(mousedown)` (auto-clearing on the next microtask if `blur` did not fire) and updated the Playwright draft-search share test (`tests/e2e/product-details.spec.ts`) to use a real mouse `.click()`.
  2. **No-op search blur and panel apply resetting copy feedback (`apps/web/src/app/catalogue/catalogue.ts`):** Guarded `commitSearch()`, `applyPanel()`, and `queryParamMap` subscription so `shareController.reset()` and `navigate()` only run when committed criteria actually change.
  3. **Focus restoration on dismissing copy notices (`apps/web/src/app/catalogue/catalogue.ts`, `apps/web/src/app/product-details/product-details.ts`, `catalogue.html`, `product-details.html`):** Restored keyboard focus to `#copyLinkButton` when dismissing `.status-banner.success` or `.share-fallback`.
  4. **`Back to catalogue` during detail loading and `.recovery-link` alignment (`apps/web/src/app/product-details/product-details.html`, `product-details.scss`):** Rendered `<nav class="detail-nav">` when `@if (loading || product)` while keeping `<div class="detail-actions">` inside `@if (product)` so every detail state has one `Back to catalogue` link; added `.error-actions .recovery-link { margin-top: 0; }`.
  5. **Catalogue heading focus outline, history state cleanup, and URL normalization (`apps/web/src/app/catalogue/catalogue.scss`, `catalogue.ts`, `product-details.ts`):** Added `outline: none` to `h1` in `catalogue.scss`, cleaned both `warning` and `fromDetail` from `location.getState()` via `replaceState`, checked `Boolean(nav?.previousNavigation?.finalUrl)` for return heading focus, used `queryParams: criteriaToQueryParams(this.criteria)` with `state: { warning: true }` on invalid `applicationArea` fallback, and used `this.product?.id || this.id` in `ProductDetailsComponent.getAbsoluteUrl()`.
  6. **Style consolidation and documentation sync (`apps/web/src/app/_shared.scss`, `README.md`, `DECISIONS.md`, `TODO.md`, `docs/agent/checkpoint.md`):** Extracted shared `.status-banner`, `.share-fallback`, and `.p-tag-warn` rules into `apps/web/src/app/_shared.scss` and updated root and agent documentation to reflect the completed v0.2.0 slice.

- **Verification evidence:**
  - `npm run check`: 69 API unit tests pass, 60 frontend Jest tests pass (including 2 new tests and expanded focus assertions in `apps/web/src/app/product-details.spec.ts`), ESLint and Prettier pass, NestJS and Angular production builds pass.
  - `npm run test:integration`: 74 PostgreSQL integration tests pass across 3 suites.
  - `npm run test:e2e`: 34 Playwright E2E browser journeys pass across desktop and mobile viewports.

## 2026-11-04 — v0.2.0 human-facing architecture and screenshots

Created `docs/human/v0.2.0/v0.2.0.md` with empty human sections and an LLM-generated architectural review. Captured 14 full-page Playwright screenshots at 1280×720 and 390×844 from the local development application. Loading, service error, clipboard failure and unavailable/missing-field states were induced in the browser; the document identifies the mocked response. Confirmed capture completed and visually inspected the mobile product detail. No application code changed and no test suite was run for this documentation-only work.

## 2026-11-04 — Clipboard fallback layout

Updated shared fallback styles and both catalogue and product templates to put the warning, link and Dismiss on one desktop row and stack the warning closely above the controls on mobile; removed the extra close button. Playwright checks against the running app verified both views at 1280 and 390 pixels, single-control dismissal and no horizontal overflow; screenshots are in `docs/human/v0.2.0/*-copy-fallback-updated.png`. Frontend Jest: 60 tests passed. Human review of the revised implementation is pending.
- Follow-up: removed the fallback URL input's desktop width cap so it fills the available row; repeated the desktop/mobile browser checks for catalogue and product and refreshed the screenshots.
- Moved updated clipboard fallback captures into `docs/human/v0.2.0/screenshots/`, replacing the older product captures and adding catalogue captures. Updated and checked all screenshot links in the milestone document.

## 2026-11-04 — v0.3.0 bootstrapping (product reviews)

Bootstrapped milestone `v0.3.0` focusing on customer reviews and ratings. Created `docs/human/v0.3.0/v0.3.0.md` with human notes and the agreed 8-stage collapsed delivery workflow, and `docs/agent/reviews/reviews-plan.md`. Updated `TODO.md`, `docs/README.md`, `docs/agent/checkpoint.md`, and `AI_USAGE.md`.


## 2026-11-04 — Phase 1 behavioral analysis agreed for v0.3.0

Finalized Phase 1 scope with the human:
- Write review presented as a dialog on desktop and full-screen overlay with `← Back to product` on mobile.
- Rating required (1-5), inline validation on submit without rating; reviewer name and comment optional.
- Reviews list uses the same batch loading mechanism (sentinel + Load more fallback) as the catalogue, ordered strictly newest first.
- Allowed across all product statuses; moderation and authentication explicitly documented as out of scope.
- Recorded spec in `docs/agent/reviews/reviews-plan.md` and updated checkpoint.


## 2026-11-05 — Reviews test preparation

Clarified failure and retry behavior in the reviews plan and recorded the agreed duplicate-review trade-off in DECISIONS.md. These are proposed tests and agreed behavior, not an implementation or test result. No tests run for documentation-only changes.

- Prepared a proposed reviews architecture for discussion during Phase 3; no application implementation or tests performed.

## 2026-11-05 — Phase 3 review tests

Added `apps/api/test/reviews.integration-spec.ts`, `apps/web/src/app/reviews.spec.ts` and `tests/e2e/reviews.spec.ts`; no review application code was implemented. The API tests use a provisional `{items, nextCursor, summary: {count, average}}` response adapter, and browser selectors propose accessible form roles and names; these details need review. API tests cover validation, pagination, aggregate, idempotent submission and import preservation. Frontend and browser tests cover representative empty, error, form and submission behaviors.

Verification: focused API integration run against isolated PostgreSQL: 22 failed, all feature tests; focused frontend Jest: 5 failed; isolated desktop/mobile Playwright: 8 failed. The absent reviews route or write action prevents reaching the intended assertions; red results do not establish that later assertions are correct. ESLint passed on the three test files and Prettier formatted them. No full-suite green claim. The human will dispatch an adversarial reviewer; timestamp tie ordering, edited submission retry, stale request handling, and deeper accessibility remain particular areas to examine.


## 2026-11-05 — Phase 4 adversarial review and hardening of review tests

Reviewed the Phase 3 review test suites (`apps/api/test/reviews.integration-spec.ts`, `apps/web/src/app/reviews.spec.ts`, `tests/e2e/reviews.spec.ts`) and cross-slice interactions (`apps/web/src/app/product-details.spec.ts`, `tests/e2e/product-details.spec.ts`, `scripts/run-browser-tests.mjs`) against [reviews-plan.md](reviews/reviews-plan.md), [architecture-proposal.md](reviews/architecture-proposal.md), and [DECISIONS.md](../../DECISIONS.md), then directly hardened the tests without modifying application implementation code:

- **Resolved cross-slice contradictions (`apps/web/src/app/product-details.spec.ts`, `tests/e2e/product-details.spec.ts`):**
  - Removed the v0.2.0 `review|rating` absence assertion from `product-details.spec.ts` and `tests/e2e/product-details.spec.ts` (which prohibited review UI on product details before v0.3.0).
  - Updated `afterEach` in `apps/web/src/app/product-details.spec.ts` to flush any open `GET /api/products/:id/reviews` requests before `http.verify({ ignoreCancelled: true })` so existing v0.2.0 detail tests remain green both before and after `ProductDetailsComponent` begins fetching reviews.
- **Hardened PostgreSQL API integration (`apps/api/test/reviews.integration-spec.ts`, expanded from 22 to 52 cases):**
  - Added direct PostgreSQL constraint and index checks: `CHECK (rating BETWEEN 1 AND 5)` (`23514`), `FOREIGN KEY ("productId")` (`23503`), `UNIQUE ("submissionId")` (`23505`), and composite index on `("productId", "createdAt", "id")` in `pg_indexes`.
  - Added trimmed-length boundary validation (`'  ' + 'N'.repeat(100) + '\n'` and `'\t' + 'C'.repeat(1000) + '  '` accepted and stored trimmed; trimmed `101` / `1001` rejected with 400), unknown/injected field rejection (`id`, `productId`, `createdAt`, `unknownField`), non-object body rejection, and exact response key checks (`id`, `rating`, `reviewerName`, `comment`, `createdAt`).
  - Added read/write coverage across all product statuses and import states (`ACTIVE`, `PHASE_OUT`, `DISCONTINUED`, `UNKNOWN`, and `presentInLatestImport: false`), uppercase UUID support, and synthetic non-UUID `TEXT` primary-key 404 rejection.
  - Hardened idempotency and conflict checks: 6-way concurrent burst with mixed-case `submissionId`, sequential replay with normalized-equivalent whitespace/null payloads, and `409 Conflict` across differing `rating`, `reviewerName`, `comment`, or `productId`.
  - Added default batch size (`10`), max batch size (`100`), and exact `(createdAt DESC, id DESC)` timestamp tie-breaking pagination across 4 identical-timestamp reviews at 1-item page boundaries.
  - Added Prisma fault injection (`P1001`) verifying generic 5xx responses without leaking SQL, hostnames, or credentials.
- **Hardened Frontend Jest (`apps/web/src/app/reviews.spec.ts`, expanded from 5 to 14 cases):**
  - Enabled `http.verify({ ignoreCancelled: true })` in `afterEach`.
  - Added coverage for closing a blank form without confirmation and restoring focus to `"Write a review"`, dirty-draft confirmation across all three fields individually (`rating-only`, `name-only`, `comment-only`), `"Keep editing"` vs `"Discard review"` state reset, field `maxLength` attributes (`100` / `1000`) and clearing the inline rating error on star selection, in-flight input disablement and duplicate-submit prevention, post-submission refresh GET failure handling (keeping the modal closed and success banner visible while showing the review-loading error with Retry), `submissionId` reuse on unchanged normalized content vs new `submissionId` generation after editing or on a second review, stale review response/error cancellation on product route changes, duplicate-click guards on initial/batch Retry and Load more, absent/discontinued product review availability, and XSS markup escaping.
- **Hardened Playwright E2E (`tests/e2e/reviews.spec.ts`, `scripts/run-browser-tests.mjs`, expanded from 8 to 11 cases):**
  - Eliminated cross-test and cross-viewport database pollution by assigning dedicated fixture product IDs per test and viewport, plus deterministic seeded reviews on product `020` when `"Review"` exists in `scripts/run-browser-tests.mjs`.
  - Added desktop centered-modal vs mobile full-screen sheet (`Back to product` button and viewport-width geometry) assertions, blank-close vs dirty-draft confirmation, empty-state to first-review transition with aggregate update, both unchanged retry (`ids[1] === ids[0]`) and edited retry (`ids[2] !== ids[1]`) after 503 failure, newest-first visual ordering with `Load more` batch failure recovery, and review submission on an absent product (`00000000-0000-4000-8000-000000000121`).

Verification:
- `npm run lint`, `npm run format:check`, and API/web TypeScript checks pass.
- API unit tests (`npm test -w @product-finder/api`): 69 passed (69 total).
- Frontend Jest (`npm test -w @product-finder/web`): 60 passed (`app.spec.ts`, `catalogue-browsing.spec.ts`, `product-details.spec.ts`), 14 failed (all 14 cases in `reviews.spec.ts` fail on the unimplemented reviews endpoint).
- PostgreSQL integration (`npm run test:integration`): 74 passed (`health`, `catalogue-import`, `catalogue-browsing`), 52 failed (all 52 cases in `reviews.integration-spec.ts` fail against the unimplemented review table and endpoints with zero vacuous passes).
- Playwright E2E (`npm run test:e2e`): 34 passed (`catalogue-browsing`, `catalogue-design`, `product-details`), 11 failed (all 11 cases in `reviews.spec.ts` fail on the unimplemented review UI).


## 2026-11-05 — Phase 5 review implementation

Implemented the Review model and migration, cursor-paginated API with on-demand aggregates and idempotent submission, and the product review section and responsive form. Re-import preservation and availability-independent access are covered by integration tests. Added the missing Jest ESM import in the hardened API test. A browser run exposed a timing race where editing immediately after a retry could submit stale content; the form now disables controls synchronously. An in-flight review read is cancelled before refreshing after successful submission.

Verification: `npm run lint` passed; `npm test` passed (69 API and 74 web tests); `npm run test:integration` passed (126 tests); `npm run build` passed with the existing initial bundle size budget warning; `npm run test:e2e` passed (45 tests). The desktop and mobile form screenshots were visually inspected. `npm run check` stopped at the formatting check because pre-existing untracked `AI_USAGE_LOG.md` does not pass Prettier; that file was left untouched. No human acceptance or Phase 6 adversarial code review has been claimed.

## 2026-11-05 — Phase 6 adversarial review and direct refinement of reviews implementation

Adversarially audited the implemented reviews slice (`6a4b1d2`) across database schema, migration, NestJS API (`apps/api/src/reviews.controller.ts`), Angular UI (`apps/web/src/app/reviews/`, `apps/web/src/app/product-details/`), and the accepted visual reference (`docs/agent/reviews/references/mobile-review-page.png`) against [reviews-plan.md](reviews/reviews-plan.md), [architecture-proposal.md](reviews/architecture-proposal.md), and [code-review.md](code-review.md).

Concrete issues found and directly resolved:
1. **Component lifecycle & stale-request hygiene on `productId` changes (`apps/web/src/app/reviews/reviews.ts`):**
   - `ReviewsComponent` only loaded in `ngOnInit` without `OnChanges` handling or generation counters on read/submit requests. Added `OnChanges` (`resetAndLoad()`), `readGeneration` / `submitGeneration` guards, and `100px` `IntersectionObserver` `rootMargin` matching `CatalogueComponent`.
2. **Dialog focus trap escape, backdrop click, and whitespace-only dirty check (`apps/web/src/app/reviews/reviews.ts`, `reviews.html`):**
   - When `document.activeElement` was `.overlay` (`tabindex="-1"`, e.g. after clicking non-interactive dialog whitespace), pressing `Tab` or `Shift+Tab` escaped the dialog because `keydown()` only checked `activeElement === first` or `last`. Updated `keydown()` to trap focus into the active dialog container whenever `activeElement` is outside `container`.
   - Added backdrop click dismissal (`onBackdropClick()`) on `.overlay` and `.confirmation-overlay`, and normalized the dirty-draft check (`this.rating || this.name.trim() || this.comment.trim()`) so whitespace-only optional fields close without a false discard prompt.
3. **Screen-reader semantics & non-color star distinction (`apps/web/src/app/reviews/reviews.html`):**
   - Review star blocks used `<div class="stars" [attr.aria-label]="...">` without `role="img"` and exposed 5 raw `★` glyphs (`★★★★★`) to assistive tech regardless of rating. Added `role="img"` and `aria-hidden="true"` on inner star glyphs across both summary and individual reviews, and switched unselected/empty stars to hollow `☆` vs filled `★` (WCAG 1.4.1 Use of Color + matching `mobile-review-page.png`).
   - Added `[attr.datetime]="review.createdAt"` on `<time>`, linked the rating `<fieldset>` to `#rating-error` via `aria-invalid` and `aria-describedby`, and formatted the summary count as `({{ summary.count }} review(s))` without trailing `&nbsp;`.
4. **Visual reference alignment & responsive layout fixes (`apps/web/src/app/reviews/reviews.html`, `reviews.scss`, `product-details.html`):**
   - Passed `[productName]="product.name || product.sku"` to `<app-reviews>` and rendered the product subtitle and header divider beneath `Write a review` to match `docs/agent/reviews/references/mobile-review-page.png`.
   - Fixed `.reviews-heading` / `h2` margin collision (`h2 { margin: 0 0 1rem }` inside flex row/column misaligned the desktop button and left a `2rem` internal gap with `0px` bottom margin on mobile).
   - Styled the post-submission banner using shared `.status-banner.success` with a dismiss button restoring focus to `Write a review`, styled `.load-error` alert and `.load-area` spacing, grouped `.field` label+input pairs with `font-weight: 600` labels, enlarged star radio touch targets to `2.75rem × 2.75rem` (44×44px) with BASF blue `#00549f` selection, and added `100dvh` + `env(safe-area-inset-bottom)` padding on mobile dialogs.

Verification:
- `npm run lint` and `npx prettier --check` pass.
- Full test suites pass across all layers: 69 API unit tests, 74 frontend Jest tests, 126 PostgreSQL integration tests, and 45 Playwright E2E browser tests.
- Ready for Phase 7 (human taste test & iterative tuning).

## 2026-11-05 — Mobile copy label

- Shortened the catalogue copy action to “Copy link” at widths up to 600px; wider screens retain “Copy link to results”.
- Frontend build passed (with the existing initial bundle budget warning); all 74 frontend Jest tests passed. A headless Chromium layout check at 320px, 390px and 800px confirmed the respective labels and no horizontal button overflow. At 320px, “Share results” wraps to two lines; this change does not address that separate layout behavior. Human review is pending.
- Follow-up: the human changed the mobile wording to “Link to results”. The frontend build and all 74 frontend tests passed again; the updated label has not had a separate browser layout review.

## 2026-11-05 — README screenshots

Captured desktop and iPhone-sized catalogue screenshots with Playwright against the local app and populated catalogue, visually inspected both, and replaced the README screenshot placeholders. The mobile capture shows the revised “Link to results” label.

## 2026-11-05 — Phase 8 final review and audit of the complete reviews feature

Conducted the final review pass of the entire product reviews feature (v0.3.0) across data layer, backend API, frontend components, and cross-slice interactions:
- Audited PostgreSQL schema and migration `20261105000000_add_reviews`: checked rating range constraint (`CHECK (rating BETWEEN 1 AND 5)`), composite index on `("productId", "createdAt" DESC, "id" DESC)` for cursor pagination, and unique constraint on `submissionId` for idempotency.
- Audited API controller (`ReviewsController`): verified UUID parameter and cursor parsing, keyset pagination with tie-breaker logic, aggregate count/avg computation, strict payload boundary validation, and duplicate/conflict handling (`P2002` yielding idempotent retry on exact match and 409 Conflict on payload mismatch).
- Audited frontend component and dialog UX (`ReviewsComponent`, `reviews.html`, `reviews.scss`): verified responsive design (centered modal on desktop, full-screen sheet with back-navigation on mobile), keyboard focus trap for active modal/confirmation overlays, escape and backdrop dismissal, dirty-draft confirmation guards, star rating semantics and WCAG 1.4.1 non-color distinction, in-flight input disabling, and state reset on product ID changes.
- Verification evidence:
  - `npm run check`: lint, Prettier, unit tests, and production builds pass cleanly.
  - Unit tests: 69 API tests + 74 frontend Jest tests pass.
  - PostgreSQL integration tests: 126 tests pass in `npm run test:integration`.
  - Browser e2e tests: 45 Playwright tests pass in `npm run test:e2e` across desktop and mobile viewports.

## 2026-11-05 — Railway demo

Created a private GitHub repository and Railway app and PostgreSQL services with a persistent volume. The app serves the frontend and API from one origin; a pre-deploy step applies migrations and imports the supplied catalogue only if it is empty. The first deployment exposed a missing database preparation command; after correcting its configuration, Railway applied both migrations and imported 200 products. Browser checks at 1280px and 390px loaded the catalogue and opened and reloaded a product detail URL. The container build passed with the existing frontend bundle budget warning.

- 2026-11-05: Captured four v0.3.0 review screenshots at desktop and mobile viewport sizes using the isolated browser-test stack and seeded fixtures. The temporary Playwright capture passed; screenshots depict the current working tree, including existing uncommitted changes.

## 2026-11-05 — Cross-stack code review pass (frontend, backend, data contracts)

Executed the agreed cross-stack review pass against [code-review.md](code-review.md):
- **Single-source catalogue filter/search SQL (`apps/api/src/products.controller.ts`):** Replaced the duplicated `Prisma.ProductWhereInput` vs raw `Prisma.sql` filter construction with a single `whereSql` fragment used by both the `SELECT ...` batch query and the `SELECT count(*)::int` total query, eliminating any risk of `items` and `total` diverging.
- **Shared API validation helpers (`apps/api/src/validation.ts`, `products.controller.ts`, `reviews.controller.ts`):** Consolidated `UUID_PATTERN` and `parsePaginationInt()` across both controllers.
- **Deduplicated import row-change predicate (`apps/api/src/catalogue-import.ts`):** Extracted `rowChanged(left, right)` in `importCatalogue()` so the 10-column `ROW(...) IS DISTINCT FROM ROW(...)` predicate is defined once and shared by `updated`, `unchanged`, and `ON CONFLICT DO UPDATE` timestamp preservation.
- **Dialog focus-trap & lifecycle hygiene (`apps/web/src/app/catalogue/`, `apps/web/src/app/reviews/reviews.ts`):**
  - Replaced `setTimeout` + global `document.querySelector` focus calls in `CatalogueComponent.openSearch()` and `openPanel()` with `@ViewChild` (`mobileSearchInput`, `panelDialog`) and `ngAfterViewChecked`.
  - Hardened `CatalogueComponent.onDialogKey()` and `ReviewsComponent.keydown()` with `tabindex="-1"` on dialog containers and `!active || active === dialog || !dialog.contains(active)` so `Tab` / `Shift+Tab` pulls focus into the first/last control even after clicking non-interactive dialog whitespace.
  - Replaced the growing `requests = new Subscription()` accumulator in `ReviewsComponent` with direct cleanup of `readRequest` and `submitRequest`.
- **Shared URL resolution and warning banner styles (`apps/web/src/app/sharing.ts`, `_shared.scss`, `catalogue`, `product-details`):** Consolidated `resolveAbsoluteUrl()` in `sharing.ts` and `.warning` base styling in `_shared.scss`.

Verification evidence:
- `npm run lint` and `npx prettier --check apps tests`: 0 errors.
- Unit tests (`npm test`): 69 API unit tests + 74 frontend Jest tests pass (including a new focus-trap test for dialog container focus in `catalogue-browsing.spec.ts`).
- Production builds (`npm run build`): API and web builds pass (with the existing initial bundle budget warning).
- PostgreSQL integration tests (`npm run test:integration`): all 126 tests pass across 4 suites.
- Playwright E2E browser tests (`npm run test:e2e`): all 45 desktop and mobile journeys pass in 36.9 s.

## 2026-11-05 — Review index and Railway reset

Updated the review pagination index in the Prisma schema and existing review migration to order `createdAt` and `id` descending. The PostgreSQL integration check now asserts the index directions; all 126 integration tests passed, and Prisma schema validation passed. An initial direct test invocation failed the database isolation guard because it omitted the test database configuration; the root integration command supplied it correctly. Railway reset the demo database, reapplied both migrations, and imported 200 products; the public catalogue and review read endpoint returned HTTP 200. The temporary reset switch was disabled and the reset code removed after use. The Prisma OR cursor query remains unchanged.

## 2026-11-05 — Runtime PrimeNG configuration

Added a no-store public configuration endpoint and loaded the Railway-provided PrimeNG key before frontend bootstrap, with a local-key fallback if configuration is missing or unavailable. The key is excluded from Git and remains visible to browser users. Both workspace builds and unit suites passed (70 API and 74 frontend tests). After deploying, desktop and mobile Chromium checks confirmed the key was present, the catalogue loaded, and no PrimeUI licence notice or licence console message appeared. The build retained its existing bundle-size warning.

## 2026-11-05 — Final submission pass and documentation polish

Conducted a comprehensive final pass across deliverables, links, syntax, and formatting:
- Fixed markdown link syntax for the video walkthrough in `README.md`.
- Corrected link to `AI_DECISIONS_LOG.md` and fixed minor typos, punctuation, and terminology in `DECISIONS.md`.
- Polished `AI_USAGE.md` into a concise, focused submission document, migrating trailing chronological log entries to `AI_USAGE_LOG.md`.
- Completed architectural review summaries across `docs/human/` (`v0.1.0`, `v0.2.0`, `v0.3.0`) and resolved all remaining TODO stubs.
- Updated `TODO.md` with milestone completion and post-submission future backlog.
- Verified all checks: ESLint, Prettier, 70 API unit tests, 74 frontend Jest tests, 126 PostgreSQL integration tests, and 45 Playwright browser tests.
