# Product Finder

Full-stack take-home assignment. Original brief: [ASSIGNMENT.md](ASSIGNMENT.md).

## Current scope

The bootstrap includes an Angular/SCSS/PrimeNG shell, a NestJS API with PostgreSQL readiness through Prisma, Docker Compose, Jest, linting and formatting. The product migration and manual CSV snapshot import are implemented. Catalogue discovery, product details and reviews are not implemented yet. The complete assignment is not finished.

## Prerequisites

- Docker Engine/Desktop with Docker Compose v2 or newer for the containerized application.
- Node.js **22.22.3** and npm **10.x** for local development and checks. With nvm, run `nvm install` and `nvm use` in this directory.
- Available local ports: 8180 (container web), 3100 (container API), 3101 (local API), 5432 (development PostgreSQL), 5433 (test PostgreSQL), and 4200 (Angular development server).

Commands below run from the repository root. Compose database credentials are local-development defaults, not production configuration.

## PrimeNG Community license

Use the Community offering; no Pro components are used. PrimeNG 22 requires a key for Community too: see its [installation guide](https://primeng.dev/installation) and [Community license](https://primeui.dev/licenses/community).

After `npm ci` creates the ignored `apps/web/src/primeng-license.local.ts` file, put your key in the exported value:

```ts
export const primeNgLicenseKey = 'YOUR_COMMUNITY_KEY';
```

The file starts with an empty value; `npm ci` never overwrites an existing file. An empty key leaves PrimeNG's standard missing-license notice intact. Builds and tests work with that notice. License keys are compiled into browser code as required by the library; do not put backend credentials in this file. After changing it, restart local development or rebuild the web image.

## Run with Docker

```sh
docker compose up --build --wait
```

- Web: <http://localhost:8180>
- API readiness, proxied through the web server: <http://localhost:8180/api/health>
- Direct API readiness: <http://localhost:3100/api/health>

Readiness returns HTTP 200 with `{"status":"ok"}` after querying PostgreSQL through Prisma, or HTTP 503 when the database cannot be reached. Compose waits for healthy dependencies. PostgreSQL uses a named volume.

Stop containers while preserving the database:

```sh
docker compose down
```

## Local development

On a fresh checkout, run `npm ci` once and add your PrimeNG key as described above. It creates `.env` from `.env.example` if missing and preserves an existing file. Then start the complete local development stack:

```sh
npm run dev
```

The command creates missing local configuration, starts PostgreSQL with Compose, waits for its health check, then runs Angular and NestJS in watch mode. Open <http://localhost:4200>; Angular proxies `/api` to the NestJS process on port 3101. Configuration is validated before the API starts. The example `.env` connects to the local Compose database. The local API and container API use different ports and can run simultaneously. Ctrl+C stops both watch processes and leaves PostgreSQL running; stop it with `docker compose stop db`. Its named volume preserves development data. Apply migrations and import the catalogue separately as described below; starting development does not change catalogue data.

## Build and verify

```sh
npm run check
```

This runs ESLint, Prettier checks, both Jest suites and both production builds. Individual commands:

```sh
npm run build
npm test
npm run lint
npm run format:check
npm run format
```

The API uses ESM and Jest's experimental VM-module support. Node prints the corresponding experimental warning. Frontend tests run in jsdom using `jest-preset-angular`.

The integration test starts a separate PostgreSQL container on port 5433:

```sh
npm run test:integration
```

It exercises HTTP readiness, catalogue import and the planned browsing API against an isolated test database, without using the development database. Import and browsing tests create and remove uniquely named schemas; the test container stores data in memory and loses it when stopped. Stop it with `docker compose --profile test stop test-db`.

The browsing tests are written ahead of the feature and currently fail: the application does not yet provide the catalogue screen or product API. Their request/response shape is a provisional test contract while the API is designed.

Browser tests use Playwright and Chromium:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser command starts the isolated test PostgreSQL container on port 5433, creates and migrates a uniquely named temporary database, loads synthetic fixtures, starts its own API and frontend on dynamically selected local ports, runs Playwright and removes its own database and processes. It does not reset the development database or stop an already running development server. The test container is left running for reuse. Failed-test traces are stored under the ignored `test-results/` directory. Browser/OS dependencies may require `npx playwright install --with-deps chromium` on Linux. CI runs these same checks; hosted CI results are separate from local verification.

## Database migrations and CSV import

Start the local PostgreSQL service and install dependencies (`npm ci`) first. From the repository root, apply the checked-in migrations and import the supplied CSV:

```sh
docker compose up -d --wait db
npm run db:migrate
npm run db:seed
```

The commands read `DATABASE_URL` from `.env`, unless it is already set in the environment. Migration and seed run on the host, including when the application runs in Docker. To import another CSV, pass its path relative to `apps/api`, or use an absolute path:

```sh
npm run db:seed -- /absolute/path/to/products.csv
```

Each file is assumed to be the complete catalogue. The command validates it before applying changes in one transaction. Repeated imports preserve product identity; missing products are retained and marked absent. Conflicting duplicate SKUs are reported prominently, with the more pessimistic status winning and the later row breaking ties. Unknown statuses, malformed years and missing names are reported. Warnings show up to three examples per type in the console, in yellow when stderr is a terminal; the command prints the path to a complete per-run log in the ignored `logs/` directory. The log contains full conflicting product records. Set `IMPORT_LOG_DIR` to choose another log directory. Input validation or database failures exit nonzero and keep the previous catalogue. The command refuses to start an import if it cannot create the log. If writing the final log fails after the database commit, the command reports that the import already completed and exits nonzero. A nonempty partial export cannot be reliably detected, so verify the input is complete. See [DECISIONS.md](DECISIONS.md) for assumptions and pending PM confirmation.

Prisma client generation runs during installation and API builds; run `npm run db:generate` explicitly after changing the schema. Reviews are not implemented yet, so their preservation has not been verified. No database dump is provided.

## Repository layout and decisions

- `apps/web/`: Angular application and development/production API proxies.
- `apps/api/`: NestJS API, Prisma configuration and backend tests.
- [DECISIONS.md](DECISIONS.md): foundation choices, trade-offs and outstanding product decisions.
- [AI_USAGE.md](AI_USAGE.md): collaboration source notes for human editing before submission.
- [docs/README.md](docs/README.md): supporting documentation. `docs/human/` remains reserved and empty.
