# Agent checkpoint

## Current state

The bootstrap uses PrimeNG Community; the catalogue import is implemented, and catalogue browsing is implemented, with human review pending. The repository now has npm workspaces for Angular 22 (`apps/web`) and NestJS 12 ESM (`apps/api`), Prisma 7.10.1, PostgreSQL Compose, Jest in both apps, ESLint/Prettier and CI configuration. Root README contains run/check instructions; DECISIONS.md describes foundation choices and outstanding domain decisions. ASSIGNMENT.md and data/products.csv are preserved.

The shell and readiness endpoint are infrastructure only. The import slice adds a Product model, migration and manual complete-snapshot seed. The products browsing API and UI exist; product details, reviews API/UI and review model do not. Human review of the import is pending.

## Working process and configuration

Follow root AGENTS.md. Propose acceptance behavior and material decisions, discuss, implement/verify, and return a reviewable result. The human has opened docs/human/v0.1.0/v0.1.0.md for milestone notes and architectural review; preserve their writing. AI_USAGE.md is the source log for all human steering and disagreements; do not duplicate those accounts here.

The human will provide a PrimeNG Community key in ignored apps/web/src/primeng-license.local.ts (`primeNgLicenseKey`). Do not read or print that value. npm installation initializes a blank file only when absent. Missing-key notices remain until configured. Check the package's public types/documentation for configuration; do not inspect its restricted implementation to bypass licensing.

Use Node 22.22.3/npm 10. Root `npm run check` runs lint, format check, Jest and production builds. `npm run dev` creates missing local configuration, starts Compose PostgreSQL and launches local watchers. `npm run test:integration` starts an isolated disposable PostgreSQL container on port 5433. Local API port is 3101, container API port is 3100; port 3000 belongs to an unrelated service. Web ports: development 4200, Compose 8180. Migrate and seed explicitly using the commands in README.md.

## Continuation

Consult dev.log.md for verification evidence and testing-strategy.md for the Playwright workflow. The hardened import and catalogue tests were committed as `0ec7f98`; implementation fixes pass unit, PostgreSQL integration and browser tests and await human review. Search is limited to 200 characters; import expects only the known headers and four-digit years. Catalogue browsing and design remain pending human review. Agreed catalogue rules and remaining limits are in [the catalogue browsing plan](catalogue/catalogue-browsing-plan.md). Recent searches, product details, reviews and performance diagnostics are deferred in TODO.md.

The [product details slice](product-details/product-details-plan.md) is in phase 1: the human liked the generated visual references, which are saved with the plan. The consolidated behavior still awaits human review; no phase 2 work has started.
