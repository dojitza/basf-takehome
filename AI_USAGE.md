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
