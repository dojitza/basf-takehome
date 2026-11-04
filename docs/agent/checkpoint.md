# Agent checkpoint

## Current state

The bootstrap uses PrimeNG Community; the catalogue import, catalogue browsing, and product details/sharing/navigation (`v0.2.0`) slices are implemented and verified. The repository has npm workspaces for Angular 22 (`apps/web`) and NestJS 12 ESM (`apps/api`), Prisma 7.10.1, PostgreSQL Compose, Jest in both apps, ESLint/Prettier and CI configuration. Root README contains run/check instructions; DECISIONS.md describes foundation choices and outstanding domain decisions. ASSIGNMENT.md and data/products.csv are preserved.

The shell and readiness endpoint are infrastructure only. The import slice adds a Product model, migration and manual complete-snapshot seed. The products browsing and product details (`GET /api/products/:id`, `/products/:id`) API and UI exist; the reviews API/UI and review model do not.

## Working process and configuration

Follow root AGENTS.md. Propose acceptance behavior and material decisions, discuss, implement/verify, and return a reviewable result. The human has opened docs/human/v0.1.0/v0.1.0.md for milestone notes and architectural review; preserve their writing. AI_USAGE.md is the source log for all human steering and disagreements; do not duplicate those accounts here.

The human will provide a PrimeNG Community key in ignored apps/web/src/primeng-license.local.ts (`primeNgLicenseKey`). Do not read or print that value. npm installation initializes a blank file only when absent. Missing-key notices remain until configured. Check the package's public types/documentation for configuration; do not inspect its restricted implementation to bypass licensing.

Use Node 22.22.3/npm 10. Root `npm run check` runs lint, format check, Jest and production builds. `npm run dev` creates missing local configuration, starts Compose PostgreSQL and launches local watchers. `npm run test:integration` starts an isolated disposable PostgreSQL container on port 5433. Local API port is 3101, container API port is 3100; port 3000 belongs to an unrelated service. Web ports: development 4200, Compose 8180. Migrate and seed explicitly using the commands in README.md.

## Continuation

Consult dev.log.md for verification evidence and testing-strategy.md for the Playwright workflow. The hardened import and catalogue tests were committed as `0ec7f98`; implementation fixes pass unit, PostgreSQL integration and browser tests. Search is limited to 200 characters; import expects only the known headers and four-digit years. Agreed catalogue rules and remaining limits are in [the catalogue browsing plan](catalogue/catalogue-browsing-plan.md). Additional filter/sort options, recent searches, reviews and performance diagnostics are deferred in TODO.md.

The [product details slice](product-details/product-details-plan.md) (`v0.2.0`) completed all 11 delivery phases, including human click-through acceptance (phases 8–9), final adversarial review for gaps (phase 10), and final implementation and verification (phase 11). Phase 11 resolved the desktop search `mousedown` -> `blur` race on product links and share/copy buttons, guarded no-op search blurs and panel applies against resetting active copy feedback, restored focus to the Copy link button on dismissing copy notifications/fallbacks, kept `Back to catalogue` visible during detail loading, extracted shared banner/fallback styles into `apps/web/src/app/_shared.scss`, and synchronized root/agent documentation. All checks are green (69 API unit, 60 frontend Jest, 74 PostgreSQL integration, 34 Playwright E2E across desktop and mobile, and production builds).
