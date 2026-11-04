# AI usage

Working source notes for the human to rewrite into the assignment's approximately one-page submission. Preserve concrete steering and disagreement accounts here as work proceeds. These notes distinguish proposals, human direction and completed actions; they do not imply application acceptance.

## Repository setup

OpenAI Codex was used to locate the assignment in the recruiter's email, preserve the supplied README and CSV, and prepare the initial repository and documentation scaffold. The human requested the scope and initial structure.

No application code or technical stack has been initialized. Record further uses and concrete examples of human review or corrections as the work proceeds.

## Assignment analysis

Codex read the assignment and inspected the CSV with Python to distinguish explicit grading criteria from inferred priorities. It found duplicate SKUs, conflicting status values, inconsistent formatting and missing values, and recorded proposed priorities under the v0 investigations. No sub-agents or external research were used. Scope and implementation choices remain open; this work does not yet supply the required two examples of human corrections to agent output.

The evaluation analysis currently lives in `docs/agent/evaluation-priorities.md`; its location changed during the documentation discussions below.

## 2026-11-02 — Human steering and process discussion

### Focus effort on the actual evaluation

- Human direction: "Let's analyze what the takehome grades to better inform on what I want to spend the time".
- Agent response: inspected the supplied assignment and CSV, separated explicit criteria from inferred priorities, and proposed effort allocation. The priority order and time allocation were recommendations, not agreed scope or evaluator weights.
- Status: analysis recorded; no application implementation authorized or performed.

### Examine how we collaborate before building

- Existing approach: AGENTS.md required behavioral-test discussion and version-based documentation modeled on the Fonoa take-home.
- Human direction: asked whether that process fit this assignment, emphasizing that collaboration itself is evaluated and questioning version-based documentation for this full-stack app.
- Agent proposal: a propose/discuss/implement/verify/review loop with explicit review of delivered work; small slices across application layers; autonomous routine choices; a flatter documentation structure with delivery planning by feature when useful.
- Status: the human subsequently said "I like the plan" and challenged the proposed documentation organization as described next. Application behavior and architecture remain open.

### Simplify the agent's proposed documentation structure

- Agent proposal: a purpose-based collection including a delivery plan, development log, checkpoint, investigations and optional architecture detail.
- Human correction: "I'd challenge the docs structure and simplify it. agent folder for docs meant to be read by an llm, and human folder, meant for human consumption."
- Reason stated: simplify the documentation and distinguish its intended readers.
- Result: replaced the version hierarchy with `docs/agent/` and `docs/human/`; moved the evaluation analysis into human documentation, retained work evidence and continuation context under agent documentation, and updated AGENTS.md. Required submission deliverables remain at the root. Removed empty scaffold documents and indexes.

### Keep raw collaboration evidence for later human editing

- Previous state: AI_USAGE.md contained brief tool-use summaries and a reminder to add concrete corrections later.
- Human direction: "please store all accounts of us disagreeing and me steering into ai_usage, I will rewrite it later, just want to have source data to remind myself".
- Result: expanded this file into source notes with the original context, human direction, stated rationale and outcome. Updated AGENTS.md to require continuing this practice, avoiding fabricated motives or disagreements and keeping these accounts here.
- Submission status: the human will later select and rewrite the evidence. These process examples are not being presented as two completed code-review corrections; no application code exists yet.

### Agent self-correction (not a human rejection)

- During the process discussion, Codex observed that it had added an investigation document before agreeing the desired documentation overhead. The human had not explicitly rejected that individual file.
- Keep this distinct from the human's explicit challenge to the proposed documentation organization. No human correction should be invented from an agent's own retrospective observation.

## Tools and verification for the process update

Codex used shell commands, Python file operations and apply_patch to inspect and reorganize documentation. No sub-agents were used. Documentation checks are recorded in the agent development log. No application tests apply to this documentation-only change.

## 2026-11-02 — Keep human documentation empty

- Agent action being corrected: populated `docs/human/` with evaluation analysis and described it as a place for explanations and supporting analysis.
- Human direction: "Keep the human folder empty for now, I will decide a bit later what it will be used for".
- Tentative purpose stated by the human: explain the development log in a human-readable way, including architecture and decisions/trade-offs. This remains an initial instinct rather than an agreed documentation design.
- Result: moved the evaluation notes to `docs/agent/`, left `docs/human/` empty, and updated AGENTS.md and continuation context to prevent premature content there. No placeholder file added.

## 2026-11-02 — Initialize required deliverables

- Human direction: "please also initialize the required deliverables".
- Agent action: preserved the original assignment README verbatim in root ASSIGNMENT.md, repurposed README.md as the project entry point with explicitly pending run/migration/import/test instructions, and created DECISIONS.md with fixed constraints, open choices and observed risks. Retained this file as source notes rather than prematurely condensing it for submission.
- Tools: shell, Python file operations and apply_patch; no sub-agents or external research.
- Status: documentation initialized only; no application scaffolding, dependencies, migrations, seed or tests created. The human documentation folder remains empty. No architecture choices or verification results were invented.

## 2026-11-02 — Commit the repository workflow setup

- Human direction: commit the first version of the repository meta setup, describing the workflow and development-process documentation.
- Action: reviewed the pending documentation changes and prepared a scoped conventional commit covering agent guidance, collaboration source notes, audience-based documentation and initialized submission documents. Application implementation remains outside this commit's scope.

## 2026-11-02 — Bootstrap proposal

- Human direction: read the assignment and propose a buildable, runnable repository bootstrap that conforms to the required stack; consider future features but implement none in this phase.
- Agent work: reread the assignment and guidance, checked local Node/npm/Docker availability, queried npm package versions and peer dependencies, and consulted official Angular, PrimeNG and Prisma documentation. No scaffolding, dependency installation or application code changes performed.
- Proposal: npm workspaces with Angular and NestJS apps; Docker Compose for web/API/PostgreSQL; Prisma connectivity without premature product/review models; Jest in both apps; root build/check commands and focused smoke verification. Product features and CSV import behavior remain later work.
- Findings requiring discussion: current PrimeNG v22 documentation introduces a Community/Commercial license and license-key setup; npm Prisma latest resolves to a release candidate, so a stable version should be selected explicitly. No license eligibility or dependency compatibility has been assumed or verified through a build.
- Status: proposal awaiting human review. No architecture decisions accepted by this entry. No sub-agents used.

## 2026-11-02 — Bootstrap implementation and Community license clarification

- Human direction: accepted the bootstrap proposal, selected PrimeNG Community and instructed Codex to proceed without product features. The human initially believed the key requirement applied to Pro; after Codex checked the packaged license, the human said they would provide a key and asked where it belongs.
- Implementation: npm workspaces; Angular/SCSS/PrimeNG shell; NestJS readiness through Prisma/PostgreSQL; local watch commands; Compose and production images; Jest for both apps; lint/format checks and CI configuration. Product models, migrations, CSV import and product/review flows are deliberately deferred under the agreed phase scope.
- Key setup: Codex wired the documented `license` option to an ignored local TypeScript file, created from a blank example without overwriting existing user configuration. Community was retained; no Pro component or license bypass was introduced. Valid-key behavior awaits the human's key.
- Concrete agent corrections: replaced Nest generator Vitest defaults with the required Jest setup and removed generated example/telemetry instructions; corrected the initial CommonJS API configuration after Jest failed against ESM-only NestJS 12; corrected a missing-directory assumption in the local-config helper after a clean container install failed; added OpenSSL to the slim Node image after Prisma's generator warned that it could not detect it. These are agent-led corrections, not invented human code-review rejections.
- Environment adjustment: port 3000 was occupied by an unrelated service. Codex stopped only this repo's temporary watch process and moved its API host/dev port to 3100, preserving the unrelated service. Port 8080 was also occupied, so the web host port is 8180. Container-internal API port remains 3000.
- Tools: official CLI generators through npx, npm metadata/install/audit, official documentation browsing, shell/Python/apply_patch, Docker Compose, Jest, and temporary Playwright tooling outside the repository for browser smoke checks. No sub-agents used.
- Review status: implementation remains awaiting human review. Verification evidence and remaining limitations are tracked in the agent development log; a configured CI workflow is not a claim of a successful hosted run.

- Verification outcome: root checks passed (11 API unit cases, one frontend test and both production builds); the real PostgreSQL integration test passed; container startup, desktop/mobile browser checks, database outage/recovery and named-volume restart checks passed locally. CI is configured but has not run on the hosted service. PrimeNG still reports the absent key, as expected until supplied by the human.

## 2026-11-02 — Simplify local development

- Previous behavior: the bootstrap documented separate configuration, installation, PostgreSQL startup and watcher commands. The human challenged the absence of a single local end-to-end development command and asked whether SQLite would be feasible.
- Discussion: Codex acknowledged that PostgreSQL startup could be automated, and recommended retaining the required PostgreSQL engine rather than maintaining separate SQLite configuration and provider-specific migrations. The human asked how to approach the dependency; Codex proposed one development command, persistent development data, separate integration-test data and future migration/import setup.
- Human direction: "Ok, please do the changes and document them". Implemented the agreed workflow, isolated integration database and documentation. Migrations and import remain pending because they do not exist yet; no automatic reset or import is claimed.
- Tools: shell, Docker Compose and official Prisma documentation; no sub-agents. Verification and remaining limits are recorded in the agent development log.

## 2026-11-02 — PrimeNG version and licensing risk

- Human question: could an older PrimeNG version avoid the key requirement? Codex checked the vendor's licensing information and npm peer dependencies: PrimeNG 21 is MIT-licensed but declares Angular 21 peers, while the assignment requires latest stable Angular and PrimeNG.
- Human direction: keep version 22 to preserve peer compatibility and trace it to the challenge requirements; record PrimeNG as a licensing risk and reevaluate if the company does not already have a license.
- Result: documented the decision and unresolved company licensing check in DECISIONS.md. The existing dependency configuration already pins PrimeNG 22.1.4 and uses Angular 22; no dependency change was needed. No company license or key validity was assumed.

## 2026-11-02 — Local API port conflict

- Human report: the local API failed to start with `EADDRINUSE` on port 3100; requested new ports.
- Cause: Codex had left the containerized API running for review on the same port used by local development. Although the earlier README mentioned stopping Compose first, the shared port undermined the single-command workflow.
- Action: assigned local API port 3101 and kept the container API on 3100, updating the local proxy, example configuration and instructions. Existing local configuration is only adjusted when it still uses the previous default.

## 2026-11-02 — Plan browser tests and the feature workflow

- Codex recommended adding Playwright alongside the first meaningful feature, rather than a placeholder bootstrap test. The human asked to establish the intended tests and development workflow before the bootstrap commit, including whether to start with tests and whether Playwright is a good frontend vehicle.
- Result: documented candidate journeys, test boundaries, a test-first feedback loop where useful, and requirements for an isolated future browser-test setup. The strategy is proposed, not implemented coverage or agreed product behavior; Jest remains required by the assignment.
- Human correction: "Do not write about tests for the feature yet, we are only doing meta work now - how we will be building once we start". Removed the candidate feature cases and feature-specific assertions from the strategy, retaining the general development loop, test boundaries and future harness workflow.

## 2026-11-02 — Narrow and simplify the first import slice

- Agent proposal: start with a catalogue browsing slice spanning import, API, UI and browser tests. Human direction: narrow the first slice to the import/export side and establish the assignment's requirements first. Discussion now concerns migrations and CSV import; no export function or nightly scheduler is required by the brief.
- Agent proposed complete-snapshot handling, case-sensitive SKU identity, rejecting unknown statuses and malformed years, preserving nameless and absent products, rejecting conflicting duplicates and using a reviewed override for the supplied conflict. Human direction: assume complete snapshots and confirm with the PM; prefer case-insensitive SKU identity and confirm it with the PM; preserve nameless records and confirm expectations with the PM/customer; retain absent products and confirm the behavior with the PM. The human accepted the text, certification, known launch-year and identical-duplicate proposals, and asked to consider unknown statuses, malformed years and conflicting duplicates further.
- Human steering: do not turn the take-home into a general data-import assignment; prefer a sane, usable import with documented assumptions. Conflicting duplicates need more thought because no authoritative source is available to resolve the supplied conflict. These remaining choices are not yet agreed or implemented.

## 2026-11-02 — Treat files as incremental updates

- Agent proposal: treat each CSV as a complete snapshot, mark absent products accordingly, and resolve status-only duplicate conflicts in favor of the more restrictive status while rejecting other conflicting duplicates.
- Human correction: assume the file updates existing data rather than replacing the complete dataset; record when data is received, created and updated. For conflicting IDs within one file, reject the later row. This makes file order relevant and keeps records omitted from the file intact.
- Result: updated the proposed import assumptions in DECISIONS.md. Exact timestamp semantics and remaining validation choices are still being discussed; no import implementation exists.

## 2026-11-02 — Unknown data and discontinued products

- Agent proposal: import unrecognized statuses as `UNKNOWN` with a warning and treat them as unavailable in the eventual UI; treat malformed launch years as unknown with a warning. Human direction: agreed to both behaviors and asked to discuss discontinued products further in light of sales reports about outdated spreadsheets.
- Status: recorded the agreed import behaviors; customer-facing availability and the conflicting status example remain open. No feature implementation or verification is implied.

## 2026-11-02 — Return to complete catalogue and pessimistic conflict handling

- Previous direction was incremental updates with first-row-wins on duplicate IDs. The agent highlighted stale availability and proposed flagging a first-row status conflict for conservative display.
- Human direction: given the assignment, return to treating the CSV as the full catalogue; for duplicate IDs choose the more pessimistic status and flag the export problem very prominently, since the PIM is our system. The human asked to highlight what remains unresolved.
- Result: updated the current import assumptions in DECISIONS.md. Precise status ordering, conflicting non-status fields, flag visibility and other details remain open; nothing has been implemented.

## 2026-11-02 — Choose whole duplicate rows and scope production operations

- Agent proposal: choose status pessimistically but take non-status fields from the first duplicate, and report warnings in the import command. Human correction: use the entire row with the more pessimistic status, breaking status ties in favor of the later row. The human agreed with the other proposed ordering, validation, timestamps and deferred UI considerations.
- Human direction: retain a manual seed script with prominent errors for the take-home; research and document a stronger nightly PIM contract, future Product Finder admin visibility and possible owner email alerts. Codex consulted AWS and Google Cloud guidance and documented a proposed future workflow. No scheduler, admin interface or alerts are implemented.
- Follow-up direction: summarize the production follow-up briefly in the import decisions. Added the concise account to DECISIONS.md and retained the detailed research link.

## 2026-11-02 — Clarify absent products and import readiness

- Human direction: assume a product absent from a complete export is unavailable while retaining its data; defer how this appears or is filtered in the UI until UI design. The human suggested an unavailable status and an explicit unavailable filter as possibilities, not settled UI behavior.
- The human accepted validating the whole input and applying the snapshot in a transaction, and agreed to verify review preservation when reviews are implemented. Recorded the absence assumption and deferred verification in DECISIONS.md; no implementation performed.

## 2026-11-02 — Tests first for import

- Human direction: start the import slice with tests first and write the first batch for human review. Added Jest examples for normalization, duplicate resolution, warning behavior and invalid files; did not implement the importer. The focused run cannot resolve the not-yet-created module, so no test cases executed. Persistence and review-preservation tests remain future work.
- Human reported the editor could not resolve Jest's `describe`. The API editor project excluded spec files and only included Node types. Included specs and Jest types in the editor project while retaining Node-only types and excluding specs from the production build. TypeScript now reports only the intentionally missing importer, and the API build passes.
- Human clarification: wanted an enumeration of proposed tests to review, including those already written, rather than the test code. Presented the behavioral cases and distinguished written tests from proposed coverage; no importer implementation was started.
- Human direction to Sol: review Terra's proposed list for complete, nonduplicative coverage, with a fast suite and no test implementation. Sol reviewed the assignment, agreed decisions and existing examples; expanded the proposed behaviors to cover CSV structure, duplicate groups, clearing values, snapshot lifecycle, timestamps, rollback and seed diagnostics. Runtime remains a target to measure after implementation, not a verified result. No sub-agents or test-code changes were used for this review.

## 2026-11-03 — Implement the reviewed import tests

- Human direction: implement the tests in the reviewed list. Codex expanded the existing Jest parser examples and added proposed PostgreSQL/seed tests, using isolated schemas and controlled timestamps. Review-preservation verification remains deferred to the review model, as agreed. No importer, migration or seed was implemented.
- Verification: lint and formatting pass; the focused Jest suites cannot resolve the absent importer and execute zero cases. TypeScript reports the missing importer and seed modules. Database behavior, test runtime and future seed/migration interfaces remain unverified.

## 2026-11-03 — Commit tests and implement the import

- Human direction: commit the reviewed tests, then implement the import script. Codex committed the tests and their editor configuration as `ff8f05f`, then implemented the migration, snapshot importer and manual seed; the implementation remains uncommitted for review.
- Agent self-correction: integration tests exposed timezone interpretation differences with PostgreSQL timestamps lacking timezone information. Changed the new schema to use timezone-aware timestamps and reran the tests successfully. Also added coverage for an all-empty record so it cannot bypass the missing-SKU validation.

## 2026-11-03 — Make seed diagnostics readable

- Human correction: the seed printed complete conflicting product rows to the console. The human asked for concise yellow warnings, at most three examples per error type with an indication of additional cases, and a detailed log file referenced in the output.
- Result: grouped and limited console warnings, with yellow on supported interactive terminals; added a unique per-run detailed log and documented its location. Full conflict rows remain available in the log. Added integration checks for truncation, log contents, color, fatal errors and an unavailable log directory.

## 2026-11-03 — Plan catalogue browsing with PrimeNG defaults

- Human direction: begin a conversational plan for the next slice, first inspecting the default PrimeNG components and identifying what the team still needs to design. Inspected the installed public component types and PrimeNG documentation, then recorded a provisional component mapping and open decisions. No UI or feature behavior was implemented or approved.

## 2026-11-03 — Discuss browsing architecture and brand reference

- Human direction: a brand reference ZIP will follow to guide custom design alongside PrimeNG components; in the meantime, discuss the feature's general architecture and produce a Mermaid end-to-end flow. Added a proposed sequence diagram to the working plan. No brand reference has been received or applied, and the flow remains open for discussion.

## 2026-11-03 — Inspect supplied brand reference

- Human supplied `basf-digital-product-reference.zip` for inspection, following the plan to use it alongside PrimeNG defaults. Codex read its reference and example tokens directly from the archive and recorded their implications and limits in the working plan. No assets were extracted or applied, and no design decisions were approved.

## 2026-11-03 — Inspect updated brand archive

- Human provided an updated brand reference and asked for inspection. Codex inspected the updated guidance, nested asset inventories and logo previews. The new archive adds six raster logos and a PowerPoint reference; recorded their formats and the remaining questions in the plan. No assets were applied and no brand permissions or design choices were inferred.

## 2026-11-03 — Check BASF font guidance

- Human shared the official BASF font page. Codex checked the page against the supplied reference, noted its downloadable Roboto archive and the restrictions on New Helvetica, Roboto Variable/Condensed and Arial. The download's contents have not been inspected and no font has been installed or selected.

## 2026-11-03 — Generate catalogue design alternatives

- Human direction: use ImageGen to create three BASF-guidance-aligned design sets, each covering four primitives in a consistent visual language, for the human to choose from. Codex generated three concept boards, each with desktop/mobile layout, search, product results and availability indicators; they explore table/list, bordered cards and structured rows. Text, navigation and controls in the generated images are illustrative, not agreed functionality or verified catalogue data. No design has been selected or implemented.

## 2026-11-03 — Reject space-heavy browsing concepts

- Agent generated three catalogue concepts with prominent headings, explanatory copy, search areas, results headers and pagination. Human rejected all three because these elements consume screen space that should prioritize products, and asked whether they can be collapsed within BASF guidance and the assignment. Codex distinguished functional requirements from presentation choices; compact presentation remains to be designed and agreed. No new images were generated.

## 2026-11-03 — Explore a denser catalogue concept

- Human direction: retain the logo and blue header with navigation/hamburger, and generate one concept incorporating the requested denser layout. Codex used ImageGen with the prior concept and the supplied blue logo as references; the result explores a compact toolbar, product rows and load-more control. Generated logo, product data and navigation are illustrative; no design or functionality has been approved or implemented.

## 2026-11-03 — Discuss result loading

- Agent introduced a “Load more” control in the compact concept as an illustrative choice. Human questioned that choice, asked whether explicit pagination is clearer for B2B, and expressed a preference for infinite scrolling with good filtering over manual pages. Discussed trade-offs and accessibility; no loading interaction or filtering scope has been agreed or implemented.

## 2026-11-03 — Choose accessible automatic loading

- Human agreed to accessible infinite automatic loading and requested a revised design. Codex generated a compact desktop/mobile concept with in-flow loading feedback and a manual next-batch fallback, and updated the working plan. The exact visual treatment, fallback behavior and filtering scope remain open; no browsing feature has been implemented.

## 2026-11-03 — Reconsider mobile filter controls

- Agent's automatic-loading concept used separate filter and sort dropdowns on mobile. Human questioned whether dropdowns fit a mobile interface and asked for alternatives. Codex compared compact buttons, drawers and visible quick filters using PrimeNG primitives; no replacement or filter scope has been agreed or implemented.

## 2026-11-03 — Compare mobile filter concepts

- Human requested images of the alternative mobile controls discussed. Codex generated one comparison board showing separate filter/sort controls, a combined drawer, and quick filters. Example filter values and statuses are illustrative; no alternative has been chosen or implemented.

## 2026-11-03 — Explore drawer and full-screen mobile search

- Human preferred the drawer idea, proposed sort/filter pills and horizontally scrolling active selections, and asked for a full-screen search view with recent searches. Codex generated a three-screen concept illustrating the catalogue, filter/sort drawer and search view. Filter choices, persistence of recent searches and detailed interaction remain open; no UI has been implemented.

## 2026-11-03 — Optimize drawer controls for mobile

- Human liked the mobile drawer/search concept and directed that the drawer controls be optimized for mobile. Recorded the need for suitable touch targets, spacing, readable labels and viewport/keyboard handling in the plan; implementation remains pending.

## 2026-11-03 — Preserve mobile design reference

- Human asked to add the design reference to `docs/agent/`. Copied the latest generated mobile concept there and linked it from the working plan; the supplied brand archive remains separate.

- Human additionally requested the desktop design reference. Copied the latest desktop concept into `docs/agent/` and linked it from the browsing plan; the image also contains an earlier mobile concept.

## 2026-11-03 — Revisit desktop visual hierarchy

- Human requested that the desktop reference show only the desktop view, and observed that the list feels busy and overuses the primary color. Codex generated a desktop-only reference based on the previous composite, replaced the reference image, and discussed ways to make names, metadata, status and actions clearer. Hierarchy changes remain proposals for discussion; no feature was implemented.

## 2026-11-03 — Product result click target

- Agent asked whether the product name alone or the entire result row should lead to details. Human chose the entire row. Recorded the direction and its keyboard/focus implications in the browsing plan; details navigation is not implemented.

## 2026-11-03 — Revise desktop visual hierarchy

- Human requested a revised design after choosing whole-row navigation and identifying excessive blue and visual noise. Codex used ImageGen to explore a calmer desktop list, then updated the reference in `docs/agent/`. The design remains illustrative and awaits human review; generated catalogue details are not verified.

## 2026-11-03 — Remove invented navigation

- Generated concepts included Products, Applications, Resources and Contact navigation without implemented destinations. Human questioned those links and directed us to design without that navigation. Codex confirmed the frontend route list is empty, regenerated desktop without the links and mobile without the corresponding hamburger, and updated the design references. Search-view back navigation remains. No application routes were added.

## 2026-11-03 — Align mobile result styling

- Human noticed that the mobile result list had not been aligned with the revised desktop colors. Codex acknowledged the omission, used ImageGen to align mobile row typography and availability treatments, and updated the reference. The image is illustrative and its filter selections and shown results are not a behavioral specification.

## 2026-11-03 — Use design references pragmatically

- Human clarified that the design images are references, not pixel-perfect targets. Implementation should lean heavily on PrimeNG components and existing behavior, using the references where PrimeNG does not provide an opinion or component. Recorded this direction in the browsing plan; no application code changed.

## 2026-11-03 — Shareable views and frontend architecture

- Agent proposed a lightweight end-to-end journey overview with separately shareable product and catalogue URLs, leaving exact shared scroll restoration open. Human agreed, preferred not to define detailed references yet, and added that an individual review should be shareable; the review flow remains undecided.
- Human requested a frontend architecture proposal. Codex documented provisional routing, URL and transient state boundaries, API client, incremental loading, accessibility and testing in the browsing plan. No architecture or implementation details beyond the sharing direction have been approved.

## 2026-11-03 — Define frontend test coverage

- Human requested a rough frontend test plan distinguishing end-to-end, integration and unit tests. Codex outlined proposed boundaries and behavior in the working plan, conditional on the eventual slice scope; no tests or application code were implemented and the proposed list has not been approved.

## 2026-11-03 — Expand browsing test coverage

- The initial test outline emphasized frontend behavior with a few browser journeys. Human requested a fuller behavior list across frontend, backend, integration and Playwright, with sufficient coverage and short runtime, explicitly without implementing tests. Codex expanded and linked a behavioral test list, assigning cases to boundaries, preserving unresolved product decisions and keeping details/reviews conditional. No test code was written or run, no agents were delegated work, and runtime remains unmeasured.

## 2026-11-03 — Commit the plan and start test-first browsing

- Human requested logging deferred tests, committing the browsing plan, and then implementing the test list. Codex recorded later detail/review, optional recent-search, performance and accessibility coverage in TODO.md, and prepared a scoped plan commit. The request authorizes test implementation; unagreed product behavior and interfaces remain provisional.

## 2026-11-03 — Agree initial catalogue rules while writing tests

- Human requested discussing the catalogue rules while the test work is underway. From the presented options, the human chose trimmed case-insensitive substring search on product name and SKU; displaying all products in the latest import with clear status by default; and status plus application-area filters. Absent products remain excluded by default as previously agreed. Filter combinations, sorting and the explicit absent-product control are still being discussed; any test wire format is provisional.

- The human then chose OR within each filter and AND across filter groups; name A–Z and Z–A with A–Z as default, unnamed products last and SKU as tie-breaker; and a separate “Not in latest import” availability option. The exact absent-option behavior, search submission and recent-search scope remain under discussion.

- Human changed the separate absent-product option: absent products should be bundled with unavailable/unknown statuses as unavailable in the UI, while source status and absence remain distinguishable in storage. Human selected automatic search after a pause on desktop, confirmed search on mobile, and inclusion of local recent searches. Codex requested clarification of the exact unavailable mapping, which searches are recorded and history behavior; tests and plan are being adjusted.

- Human clarified that the unavailable UI category includes unknown and absent products; discontinued remains separate. Searches committed from desktop and mobile should both appear in local recent history. Human asked how a typing pause relates to browser history and suggested focus loss; Codex explained the debounce interval and asked whether Enter/focus loss should create one entry. That history decision remains pending.

- Human chose one browser-history entry when a desktop search is committed with Enter or by leaving the field; results still update automatically after a typing pause. Back should return to the previous committed view. Recorded the decision for browser coverage.

- Human changed the recent-search decision again: remove search saving/recent searches from the slice and document it as a later option. Human chose to ignore invalid or unsupported shared-URL filter/sort values with a short warning and defaults, and confirmed drawer changes apply explicitly while dismissal discards drafts. Codex removed recent-search tests from the current suite and updated the deferred list and test expectations.

- Codex implemented a test-first browsing batch and an isolated Playwright harness using Jest, Supertest, PostgreSQL and Chromium. The tests use a provisional HTTP/offset contract for review; it is not an agreed API design. Current runs reach the missing UI/API and fail there, so later assertions and performance are not yet verified. Existing import/readiness tests and application builds were checked separately. The tests and follow-up decisions remain uncommitted.

- During test review, Codex corrected its own browser fixture mismatch: the second search in the sharing journey originally selected a product outside the active application-area filter. Adjusted the synthetic fixture and test data, then verified isolated stack startup and test discovery. This was an agent self-correction, not a human-directed change.

During catalogue implementation the agent initially used Angular's default component change detection without explicitly marking asynchronous HTTP updates; the test-first suite exposed stale loading/results. The agent corrected the implementation to mark the view for asynchronous changes. A temporary switch to eager change detection produced development-mode expression-change errors and was replaced. This was an agent self-correction, not human steering. Visual inspection also exposed the default green PrimeNG action color; the agent changed the preset to the agreed blue direction.

The human reported that the application loaded indefinitely using the machine’s Tailscale hostname. The agent investigated and found the local-only Angular listener and host rejection; added an opt-in tailnet development command and documented the required restart. Device-side confirmation is pending.

The human reviewed the catalogue design and noted the missing logo and that filter/sort did not match the expected drawer design. They deferred the drawer presentation itself and directed that both panels keep a visible header (title, close/back and reset) and a bottom-anchored full-width Apply control with a selection count, with only the content scrolling; the separate Cancel action should be removed and close/back should discard draft changes. They asked which parts merit automated tests. These corrections are recorded for discussion; no implementation change has been made yet.

The human added that search, filters and sort buttons should have equal width and visual priority, and each should have an icon. This is a correction to the current catalogue control hierarchy; implementation is pending. The mobile toolbar is the clear immediate target, while desktop treatment remains to be confirmed.

The human requested color coding for product statuses: active neutral, discontinued light red and phase-out light yellow. The current implementation uses neutral tags for every status. The change is pending implementation and accessibility review.

For the requested design corrections, Codex committed the original implementation, then added and committed browser tests before changing the design. The human had not chosen sort-count semantics; Codex assumed one sort is always selected and displayed Apply (1), pending review. Codex first wrote the status-color test against the transparent label inside PrimeNG’s tag; inspecting the rendered DOM showed the tag host owns the background, so Codex corrected its own test and amended the test commit. This was an agent self-correction. The supplied BASF raster logo was included unchanged at the human’s request; suitability and permission for use beyond the take-home remain to be confirmed.

The human reported that the logo displayed as a broken image and provided a screenshot. At the time of the subsequent commit request, the local tailnet server returned the JPEG successfully; the cause of the reported device-side failure and whether it is resolved remain unverified.

The human confirmed that the logo now renders, but its background appears slightly different from the header on mobile. They also requested a visible active-search pill and styling closer to the design reference, using PrimeNG where possible. Codex converted the supplied CMYK logo to sRGB, matched the header, and used PrimeNG buttons styled as removable light-blue pills; it also included a removable non-default sort pill consistent with the earlier active-sort direction. The result awaits human review on their device.

The human requested that the filter and sort panel titles align left next to the close button instead of sitting centered between close and reset. Updated the shared panel header layout; other pending changes were preserved.

The human requested moving the mobile search label into the field as a hint and moving the close control to the right of the field. Codex kept a visually hidden accessible label, added the placeholder and placed an explicitly labelled close button alongside the input.

The human asked to align “Product Finder” to the right of the header; it previously sat next to the logo. Codex adjusted the header layout so the logo and title occupy opposite ends of the content area.

The human asked for the title's right spacing to match the visible left spacing of the logo. Codex accounted for the inset baked into the logo image when aligning the title.

The human asked to remove debounced desktop search after the design commit, updating documentation and tests first and confirming the tests fail before implementation. Codex retained the previously agreed Enter and blur commit actions and changed searches to run on commit rather than on a typing pause.

After ImageGen exploration of mobile and desktop no-results states, Codex recommended the second, left-aligned option for the business app. The human agreed and chose “Clear filters” when filters are active and “Clear search” when only a search is active. Codex implemented the selected direction; clearing filters also clears the search and preserves sorting, as proposed.

## 2026-11-03 — Review and tighten catalogue browsing tests

- Human direction: review the catalogue feature end-to-end (excluding the import script), focusing on whether the tests are robust enough; then tighten existing tests and write the missing ones without fixing any implementation gaps they expose.
- Agent findings and action: identified false positives in existing tests (status assertion passing on product name `"Unavailable"`, Playwright sharing journey filtering a single-item search where filters/sort cannot alter results, manual load-more test scrolling the `IntersectionObserver` sentinel via `focus()`, and retry test omitting criteria) plus missing coverage and implementation gaps. Tightened frontend Jest, API PostgreSQL integration Jest, and Playwright E2E suites and added the missing test cases while leaving application code unchanged. No sub-agents were used.

## 2026-11-03 — Review and tighten import tests before fixing implementation

- Human direction: review the import script with a focus on whether the tests are robust enough, then tighten those test cases without fixing the implementation yet if tests break.
- Agent findings and test changes: identified overly permissive warning assertions, missing zero-warning checks on valid inputs (including `''` and `'n/a'` launch years), unasserted parser metadata (`diagnostics`, `rowCount`, `duplicateRows`), untested nullable text columns (`function`, `application_area`, `region`), unasserted outcome counts across consecutive absences and returning products, untested post-commit log failure handling, and three parser edge cases (`launch_year` accepting arbitrary signed 32-bit integers, unknown extra CSV headers being ignored, and a later duplicate row matching an earlier winning row after a conflict being treated as an identical duplicate instead of a conflicting tie-break).
- Result: tightened `apps/api/src/catalogue-import.spec.ts` and `apps/api/test/catalogue-import.integration-spec.ts` while leaving `catalogue-import.ts` and `catalogue-seed.ts` untouched. All 16 integration cases pass; 7 unit cases in `catalogue-import.spec.ts` now fail against the unfixed implementation on those three parser edge cases. No sub-agents were used.

## 2026-11-03 — Address adversarial test findings

The human asked Codex to commit the adversarial test hardening first and then fix the implementation against those tests. Codex committed the tests and supporting review notes, implemented the fixes, adapted the database fixture, and added a browser regression for the search-chip interaction. No sub-agents were used for this work.

## 2026-11-03 — Human-readable architectural review

The human requested a readable architectural review in the existing `docs/human/v0.1.0.md`, opening the previously reserved human documentation folder. They prioritized the story of boundaries, persistence, concurrency and state ownership over exhaustive implementation detail. Codex preserved the human's existing notes and added a review grounded in current source code and agent documentation, including implementation limits. No sub-agents were used.

## 2026-11-03 — Explore desktop catalogue density

The human observed that the desktop catalogue seems to have too much whitespace and would like to explore a denser layout. Codex recorded this as a pending design exploration in TODO.md; no design or implementation change has been agreed.

The human also suggested exploring a data grid for the catalogue list and developing the design further with customers. Codex added both to the pending exploration; no approach has been selected.

## 2026-11-03 — Defer broad refactoring

The human proposed five frontend/backend review loops with Codex finding issues and Luna at max reasoning fixing them. Codex recommended finishing the agreed core features first, then reviewing concrete issues in bounded batches with an early stop when no material findings remain. The human deferred the workflow and requested retaining the review criteria for future use. Codex documented them in docs/agent/code-review.md and linked them from the documentation index and backlog. No refactoring or delegation was performed.

## 2026-11-03 — Next slice delivery process

The human specified an eleven-phase process covering behavioral scope, architectural constraints, tests, adversarial reviews, implementation, human click-through and feedback loops, then final review and fixes. They requested recording it for target v0.2.0 and starting only phase 1. Codex recorded the checklist and proposed product details, direct links and catalogue return behavior as the next slice, with reviews separate. Scope remains pending human agreement; no tests, implementation or delegation were performed.

## 2026-11-03 — Phase 1 scope clarification

The human requested iterative questions before reviewing Codex’s understanding. They selected inspecting/sharing products, sharing catalogue searches and additional filtering/sorting, confirmed launch-year sorting in principle, and requested recommendations for filters and other sorts. Codex inspected CSV field values to ground those recommendations. Detailed behavior and filter selection remain pending; no implementation started.

## 2026-11-03 — Keep the current slice focused

After Codex proposed function filtering and launch-year sorting alongside product details, the human directed deferring all new filtering and sorting to the following slice and returning this slice to sharing and navigation as initially recommended. Codex updated the current proposal and preserved the discussed options, recommendations and unresolved semantics in docs/agent/catalogue-filter-sort-follow-up.md. Product inspection remains part of the original slice; detailed behavior is still in phase 1 discussion.

## 2026-11-03 — Sharing context and restoration questions

Codex proposed copying catalogue criteria without position and returning direct product visitors to the default catalogue. The human requested native mobile sharing and including the sender’s catalogue criteria in product links. They ideally want full return restoration but questioned accessible infinite-scroll complexity and whether page-based navigation would be preferable. Codex updated the proposal; pagination and restoration boundaries remain under discussion.

## 2026-11-03 — Sharing agreement; restoration still open

The human accepted native sharing where supported plus Copy link, normal cancellation and manual-copy fallback. They accepted product identity independent of carried catalogue criteria and default-catalogue return for links without criteria. They explicitly requested more restoration discussion rather than accepting Codex’s proposed session-only restoration boundary. Phase 1 continues; restoration is not agreed.

## 2026-11-03 — Simplify catalogue return

Codex proposed retaining loaded results and restoring the opened product’s position/focus during normal navigation. The human initially preferred exact restoration if inexpensive, then directed starting at the top for all scenarios, describing sharing scroll position as overkill. Codex interpreted the latest direction as criteria preservation without position restoration on catalogue visits or returns, stated that interpretation, and updated the plan. No implementation started.

## 2026-11-03 — Product information agreement

The human accepted all proposed customer-facing product fields without database/import metadata, the SKU/Not provided/None listed fallbacks, and retained detail access with clear availability explanations for absent, discontinued, phase-out and unknown-status products. Phase 1 continues toward a complete understanding for human review.

## 2026-11-03 — Phase 1 understanding ready for review

The human accepted whole-row links to a dedicated responsive product page in the existing visual style, normal link behavior, return/sharing controls and no review placeholders. They accepted Product not found with return preserving valid criteria, plus Retry/return on service failures without stale details. Codex consolidated the agreed behavior and acceptance examples for human review, leaving phase 1 open and phase 2 unstarted.

## 2026-11-03 — Visual references for review

The human requested ImageGen desktop and mobile references for the enumerated screens before proceeding. Codex used the built-in ImageGen tool and existing catalogue captures to generate review-only references for catalogue, product details, loading, not found, service error, sharing feedback, and unavailable/missing data. The images are illustrative and await human review; no application changes or delegation were made.

## 2026-11-04 — Save design references and group agent documentation

The human said the generated designs looked good and asked to bank them and make the agent documentation slightly less flat. Codex saved the seven desktop/mobile ImageGen reference boards alongside the product details plan, grouped catalogue and brand materials, and updated documentation links. The designs are accepted as reference direction; behavioral review and implementation remain pending. The existing human-folder reorganization was preserved.
