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
