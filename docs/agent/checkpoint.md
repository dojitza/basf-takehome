# Agent checkpoint

## Current state

Repository contains the supplied assignment and CSV, documentation and agent guidance. No application, dependencies, migrations, seed or tests exist. Application scope and architecture remain undecided.

Required root documentation deliverables are initialized: README.md (pending runnable instructions), DECISIONS.md (working outline) and AI_USAGE.md (collaboration source log). The original assignment text was preserved verbatim in ASSIGNMENT.md before repurposing README.md at the human's request to initialize deliverables.

## Agreed working process

Follow root AGENTS.md. Use small delivery slices: propose behavior and significant choices, discuss with the human, implement and verify, then present a reviewable result for human feedback. Routine implementation details do not need repeated approval.

Supporting documentation is grouped by audience under docs/agent/ and docs/human/. Keep docs/human/ empty until the human decides its use; a human-readable account of development, architecture and trade-offs is only a tentative direction. Root AI_USAGE.md holds source accounts of human steering and disagreements; the human will rewrite it for submission. Do not duplicate those accounts in other logs.

See [testing strategy](testing-strategy.md) for the proposed development and test workflow.

## Next work

Agree initial scope, priorities, material assumptions and representative acceptance behavior before application implementation. The analysis in evaluation-priorities.md is advisory, not an agreed scope or architecture. No application implementation has been authorized yet.
