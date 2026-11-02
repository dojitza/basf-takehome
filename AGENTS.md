# Resume notes

- At the start of each interaction, check the root `RESUME.md`. If it contains notes, first remind the human to check it, then proceed with their task. Repeat the reminder while the file is populated.
- Keep `RESUME.md` unless the human explicitly requests its removal.

# Working on the assignment

- Treat the root `README.md` and `data/products.csv` as the supplied assignment and example export. Preserve their original content unless the human requests changes.
- Respect the assignment's fixed technology constraints and deliverables. Do not initialize or implement the application until requested.
- Preserve unrelated existing changes. Commit only when explicitly requested; use granular, scoped conventional commit subjects.
- Work with the human on scope, assumptions, priorities and significant design trade-offs. Start each delivery iteration by defining representative behavioral tests in a review loop, then implement and verify the agreed behavior. Add tests for meaningful edge cases and defects.
- Maintain an honest `AI_USAGE.md` describing actual tools, delegation and concrete corrections; do not invent examples or decisions. The human owns and must be able to explain the result.

# Version documentation

Follow the Fonoa take-home documentation structure, adapted to this project:

- `docs/README.md` is the documentation entry point; `docs/versions/README.md` indexes major versions.
- Store current documentation under `docs/versions/v<major>/`. Use flat `releases/v<semver>.md` records for meaningful releases or experiments.
- Each major version has a `README.md` summarizing scope, status, coverage, important limits and open work; `architecture.md` for the current design and trade-offs; `agent-checkpoint.md` for concise continuation context; and `dev.log.md` for dated requests, decisions and evidence.
- Place historical proposals and experiments under `investigations/`, and supporting evidence under `assets/` when useful. Keep runtime assets with the application.
- Record material decisions, assumptions, alternatives, verification and open questions as work progresses. Clearly distinguish planned work from implemented and verified behavior. Do not claim a release, deployment, acceptance or test result without evidence.
- Maintain the required root `DECISIONS.md` and `AI_USAGE.md` as the work develops, and document how to run the app, migrations, seed and tests in the root README when implemented.
