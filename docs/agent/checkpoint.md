# Agent checkpoint

## Current state

The bootstrap uses PrimeNG Community; the catalogue import is implemented, and catalogue browsing is implemented, with human review pending. The repository now has npm workspaces for Angular 22 (`apps/web`) and NestJS 12 ESM (`apps/api`), Prisma 7.10.1, PostgreSQL Compose, Jest in both apps, ESLint/Prettier and CI configuration. Root README contains run/check instructions; DECISIONS.md describes foundation choices and outstanding domain decisions. ASSIGNMENT.md and data/products.csv are preserved.

The shell and readiness endpoint are infrastructure only. The import slice adds a Product model, migration and manual complete-snapshot seed. The products browsing API and UI exist; product details, reviews API/UI and review model do not. Human review of the import is pending.

## Working process and configuration

Follow root AGENTS.md. Propose acceptance behavior and material decisions, discuss, implement/verify, and return a reviewable result. Keep docs/human/ empty. AI_USAGE.md is the source log for all human steering and disagreements; do not duplicate those accounts here.

The human will provide a PrimeNG Community key in ignored apps/web/src/primeng-license.local.ts (`primeNgLicenseKey`). Do not read or print that value. npm installation initializes a blank file only when absent. Missing-key notices remain until configured. Check the package's public types/documentation for configuration; do not inspect its restricted implementation to bypass licensing.

Use Node 22.22.3/npm 10. Root `npm run check` runs lint, format check, Jest and production builds. `npm run dev` creates missing local configuration, starts Compose PostgreSQL and launches local watchers. `npm run test:integration` starts an isolated disposable PostgreSQL container on port 5433. Local API port is 3101, container API port is 3100; port 3000 belongs to an unrelated service. Web ports: development 4200, Compose 8180. Migrate and seed explicitly using the commands in README.md.

## Continuation

Consult dev.log.md for exact verification evidence/status and testing-strategy.md for the planned development and Playwright workflow. Bootstrap verification passed locally (see dev.log.md). The catalogue-browsing plan and test list were committed as 96a3232. The tests were committed as 935ba13; catalogue implementation was committed as 8f87078 and initial design-correction tests as 6dfc783; design changes are ready for the requested commit; human review is pending. The human reported a broken logo; the current server returns the JPEG but the reported browser failure remains unverified. See dev.log.md for evidence and catalogue-browsing-plan.md for behavior and limits. Agreed catalogue rules are in catalogue-browsing-plan.md. Recent searches, product details, reviews and performance diagnostics are deferred in TODO.md.
