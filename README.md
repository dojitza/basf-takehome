# Product Finder

Full-stack take-home assignment. Original brief: [ASSIGNMENT.md](ASSIGNMENT.md).

## Current scope

The bootstrap includes an Angular/SCSS/PrimeNG shell, a NestJS API with PostgreSQL readiness through Prisma, Docker Compose, Jest, linting and formatting. Catalogue discovery, product details, reviews, domain migrations and CSV import are not implemented yet. The complete assignment is not finished.

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

The command creates missing local configuration, starts PostgreSQL with Compose, waits for its health check, then runs Angular and NestJS in watch mode. Open <http://localhost:4200>; Angular proxies `/api` to the NestJS process on port 3101. Configuration is validated before the API starts. The example `.env` connects to the local Compose database. The local API and container API use different ports and can run simultaneously. Ctrl+C stops both watch processes and leaves PostgreSQL running; stop it with `docker compose stop db`. Its named volume preserves development data. No migrations or import run yet because neither is implemented.

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

It exercises the HTTP endpoint through NestJS and Prisma against the isolated test database, without using the development database. Test data is held in container memory and disappears when the test container stops; the command does not reset it between runs. Stop the test container with `docker compose --profile test stop test-db`. There are no domain records or migrations yet. CI runs the root checks, container startup and integration test; hosted CI results are separate from local verification.

## Database migrations and CSV import

Prisma client generation is wired into dependency installation and API builds; it can also be run explicitly:

```sh
npm run db:generate
```

The current Prisma schema has no domain models. There are no domain migrations or seed/import commands yet. The supplied [data/products.csv](data/products.csv) remains unchanged. A later iteration must implement and verify empty-database migrations, repeatable CSV import, duplicate handling and preservation of user reviews. No database dump is provided.

## Repository layout and decisions

- `apps/web/`: Angular application and development/production API proxies.
- `apps/api/`: NestJS API, Prisma configuration and backend tests.
- [DECISIONS.md](DECISIONS.md): foundation choices, trade-offs and outstanding product decisions.
- [AI_USAGE.md](AI_USAGE.md): collaboration source notes for human editing before submission.
- [docs/README.md](docs/README.md): supporting documentation. `docs/human/` remains reserved and empty.
