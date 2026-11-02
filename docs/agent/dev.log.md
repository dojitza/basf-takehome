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

## 2026-11-02 — Proposed testing strategy

Added testing-strategy.md with candidate browser journeys, Jest and PostgreSQL test boundaries, an incremental test-first loop and isolation requirements for a future Playwright setup. These are plans for discussion and future feature slices, not implemented tests. No application code or test harness changed.

The strategy was subsequently narrowed to the general development and testing process; feature-specific test cases will be agreed when feature work begins.
