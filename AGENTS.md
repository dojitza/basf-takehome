# Working on the assignment

- The supplied assignment is preserved verbatim in root `ASSIGNMENT.md`; `README.md` is the project setup and usage deliverable. Preserve `ASSIGNMENT.md` and `data/products.csv` unless the human requests changes.
- Respect the assignment's fixed technology constraints and deliverables. Do not initialize or implement the application until requested.
- Preserve unrelated existing changes. Commit only when explicitly requested; use granular, scoped conventional commit subjects.
- Work in small delivery slices spanning the necessary frontend, backend and data layers. Before implementation, propose the outcome, scope, material assumptions, significant alternatives and representative acceptance behavior; discuss and agree these with the human.
- Implement and verify the agreed behavior autonomously on routine details. Revisit an agreement when new evidence materially changes its consequences. Do not repeatedly request approval for settled choices.
- End each iteration with a reviewable result: behavior delivered, how to try it, important code paths, verification results and known gaps. Obtain human feedback and incorporate corrections before treating the slice as human-reviewed.
- Choose verification appropriate to the risk: meaningful automated tests for behavior, edge cases and defects, plus browser review for interaction and mobile usability. Distinguish acceptance examples from tests actually implemented and run.
- Maintain an honest `AI_USAGE.md` describing actual tools and delegation. It is a working source log for the human to rewrite later, not yet a polished one-page submission. Record every actual disagreement and instance of human steering there, with the original proposal or behavior, the human's direction, the reason when stated, and the resulting action or pending status. Distinguish human corrections from agent self-corrections; do not invent examples, motives or decisions. Keep these accounts in `AI_USAGE.md` rather than duplicating them across supporting docs. The human owns and must be able to explain the result.

# Documentation

- `docs/README.md` is the entry point. Group supporting documentation by intended audience: `docs/agent/` for LLM continuation and working context, `docs/human/` is reserved and must remain empty until the human decides its use. A human-readable account of development, architecture, decisions and trade-offs is a tentative direction, not an instruction to populate it.
- Keep agent continuation context concise in `docs/agent/checkpoint.md`; record material work and verification evidence in `docs/agent/dev.log.md`. Consult other documents as needed rather than loading all documentation every turn.
- Organize delivery around feature behavior when useful, without mandatory per-feature files. Do not create version/release hierarchies or empty templates without a concrete need. Keep runtime assets with the application.
- Record material decisions, assumptions, alternatives and open questions once and link to the source. Clearly distinguish proposed, implemented, verified and human-reviewed behavior. Do not claim a release, deployment, acceptance or test result without evidence.
- Keep the required submission deliverables at the root: `DECISIONS.md` for concise architecture and trade-offs, and `AI_USAGE.md` for collaboration evidence. Document how to run the app, migrations, seed and tests in the root README when implemented; preserve the original assignment verbatim in an agreed location before repurposing the README.
