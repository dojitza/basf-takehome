# Decisions

Working outline for the required 1–3-page submission. No application architecture or feature scope has been agreed or implemented. Entries below distinguish supplied constraints, open choices and observed risks.

## Architecture overview

The supplied assignment fixes Angular, TypeScript, SCSS and PrimeNG for the frontend; Node.js, NestJS and TypeScript for the backend; PostgreSQL and Prisma for persistence; Jest for frontend and backend tests; and Docker / Docker Compose and Git for tooling.

These are assignment constraints, not architecture choices made by the candidate. Repository layout, application boundaries, API, schema and runtime setup remain open.

## Significant decisions and alternatives

Application decisions are pending discussion. Record each significant choice with its context, alternatives, rationale, consequences and implementation/verification status.

## Assumptions requiring agreement

- Product availability: discovery visibility, phase-out behavior and old links to discontinued products.
- Import semantics: conflicting duplicate SKUs, incomplete values and products absent from a subsequent export.
- Discovery: search fields and matching, filter combinations, ordering, pagination and shareable URL state.
- Reviews: required fields, rating validation, reviewer identity and behavior without authentication.

These are open questions, not accepted assumptions or committed scope.

## Risks and evidence

- The supplied CSV contains 202 records and 200 unique SKUs, including an identical duplicate and conflicting statuses for one SKU, inconsistent formatting and missing values. Handling policy is undecided; see [evaluation analysis](docs/agent/evaluation-priorities.md).
- The import must work on an empty migrated database, be repeatable and preserve user reviews. No implementation or verification exists yet.
- Growth toward 50,000 products requires considering bounded queries, stable ordering and appropriate indexes. Specific techniques and performance verification remain open.
- Public review submission without authentication raises integrity and abuse questions. Authentication and moderation workflows are excluded by the assignment; remaining mitigations have not been selected.

## Scope and deliberate omissions

No delivery scope has been agreed yet. The assignment excludes authentication and application write flows other than reviews, including comments, sample requests, contact forms, email and moderation workflows. These exclusions come from the brief rather than candidate prioritization.

Record candidate-selected omissions and their reasoning here once agreed.

## Next steps toward production

Pending the initial scope and design. This section will distinguish necessary production work from optional improvements and describe remaining risks without implying that controls or features already exist.

## Verification status

Only assignment/data inspection and documentation checks have been performed. No application, migration, import or test behavior has been implemented or verified.
