# Testing strategy and development loop

This describes how we will work, not a list of feature tests. The assignment requires Jest in both applications; Playwright would supplement it for browser journeys. Select behavior and expected outcomes with the human before each slice.

## How we work

1. Describe a small user outcome and agree on representative examples, including a consequential failure or edge case. Decide which layers need evidence and how data will be controlled.
2. Start with a failing automated behavioral test when it makes the next step clearer and the relevant test setup exists. Implement a small increment, run the focused test, and repeat. Choose the test boundary appropriate to the behavior, and use focused tests while building the pieces underneath. It is acceptable to establish the harness or explore an unfamiliar component first; do not force every change through a failing end-to-end test.
3. Run the appropriate broader checks, review the experience in a browser at desktop and mobile sizes when interaction changes, and report what passed and what remains untested. The human reviews the outcome and directs corrections before the slice is considered reviewed.

## Choose the smallest useful test boundary

- **Frontend Jest:** component behavior and UI states that can be checked quickly in isolation, including input validation, loading, empty and error states, and accessible interactions. Mock dependencies where appropriate; avoid tests that only repeat template or implementation details.
- **Backend Jest and PostgreSQL integration:** validation and domain rules, API behavior, persistence and query behavior. Use a real isolated PostgreSQL database when database behavior matters, with focused cases for edge conditions and failures.
- **Playwright end-to-end:** a few high-value journeys through the real browser, application and database, checking observable user outcomes rather than implementation details. It verifies wiring and integration as well as frontend behavior, but is slower and needs deliberate data isolation. Use Jest for the many combinations and edge cases that do not require the whole stack.

## Planned Playwright workflow

Introduce Playwright and its first executable test with the first meaningful browser journey; do not add a placeholder-only suite. Keep Jest as required. Use Chromium first and add other browsers only if they address a specific risk. Prefer accessible roles, labels and visible outcomes; avoid sleeps and brittle CSS selectors.

Provide a documented command that starts or targets a controlled test stack, prepares its schema and loads deterministic fixtures as needed. The test API must point to a dedicated PostgreSQL test database, never the development volume. Isolate or reset data between tests so writes and repeated runs cannot influence each other. Define startup, readiness, cleanup and failure diagnostics when the harness is implemented; avoid stopping or overwriting an already running development stack.

Run focused browser tests during feature development and the complete small suite locally and in CI when relevant changes are ready. Browser binaries and container prerequisites, commands, fixture reset and troubleshooting must be documented in the root README when implemented. CI should use the same isolated setup. Until then there is no Playwright command or automated browser suite.
