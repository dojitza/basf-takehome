import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import pg from 'pg';

// Only this uniquely named database and these child processes are removed.
const testDatabase = `product_finder_e2e_${randomUUID().replaceAll('-', '')}`;
const adminUrl =
  'postgresql://product_finder:product_finder@127.0.0.1:5433/product_finder_test';
const testUrl = new URL(adminUrl);
testUrl.pathname = `/${testDatabase}`;
const root = resolve(import.meta.dirname, '..');
const apiDirectory = join(root, 'apps/api');
const webDirectory = join(root, 'apps/web');
let tempDirectory;
let admin;
let createdDatabase = false;
const children = [];
let interrupted = false;

function launch(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
  child.on('error', (error) => {
    child.launchError = error;
  });
  children.push(child);
  return child;
}
function finished(child) {
  return new Promise((resolveResult, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolveResult({ code, signal }));
  });
}
async function run(command, args, options) {
  const result = await finished(launch(command, args, options));
  if (result.code !== 0)
    throw new Error(`${command} failed (${result.code ?? result.signal})`);
}
async function freePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Could not allocate test port');
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}
async function ready(url, child) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.launchError) throw child.launchError;
    if (interrupted || child.exitCode !== null || child.signalCode !== null)
      throw new Error(`Test service stopped before readiness: ${url}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      /* Service is still starting. */
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Test service did not become ready: ${url}`);
}
async function stop(child) {
  if (child.launchError || child.exitCode !== null || child.signalCode !== null)
    return;
  const done = finished(child);
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
  try {
    await done;
  } finally {
    clearTimeout(timer);
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    interrupted = true;
    for (const child of children)
      if (child.exitCode === null && child.signalCode === null)
        child.kill('SIGTERM');
  });
}

try {
  await run('docker', [
    'compose',
    '--profile',
    'test',
    'up',
    '-d',
    '--wait',
    'test-db',
  ]);
  tempDirectory = await mkdtemp(join(tmpdir(), 'product-finder-browser-'));
  admin = new pg.Client({
    connectionString: adminUrl,
    connectionTimeoutMillis: 2000,
  });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${testDatabase}"`);
  createdDatabase = true;
  await run('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: apiDirectory,
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
  });
  const fixture = new pg.Client({ connectionString: testUrl.toString() });
  try {
    await fixture.connect();
    for (let index = 1; index <= 120; index++) {
      const sku = `P-${String(index).padStart(3, '0')}`;
      await fixture.query(
        'INSERT INTO "Product" (id, sku, name, "applicationArea", certifications, status, "presentInLatestImport", "createdAt", "updatedAt", "lastImportedAt") VALUES ($1, $2, $3, $4, $5, $6::"ProductStatus", true, NOW(), NOW(), NOW())',
        [
          randomUUID(),
          sku,
          `Fixture Product ${String(index).padStart(3, '0')}`,
          index % 2 ? 'Coatings' : 'Food',
          [],
          index === 4
            ? 'UNKNOWN'
            : index % 3 === 0
              ? 'DISCONTINUED'
              : index % 3 === 1
                ? 'ACTIVE'
                : 'PHASE_OUT',
        ],
      );
    }
    await fixture.query(
      'INSERT INTO "Product" (id, sku, name, "applicationArea", certifications, status, "presentInLatestImport", "createdAt", "updatedAt", "lastImportedAt") VALUES ($1, $2, $3, $4, $5, $6::"ProductStatus", false, NOW(), NOW(), NOW())',
      [
        randomUUID(),
        'P-121',
        'Fixture Product 121 Absent',
        'Food',
        [],
        'DISCONTINUED',
      ],
    );
  } finally {
    await fixture.end();
  }
  await run('npm', ['run', 'build', '-w', '@product-finder/api']);
  const apiPort = await freePort();
  let webPort = await freePort();
  while (webPort === apiPort) webPort = await freePort();
  const proxyPath = join(tempDirectory, 'proxy.json');
  await writeFile(
    proxyPath,
    JSON.stringify({
      '/api': { target: `http://127.0.0.1:${apiPort}`, secure: false },
    }),
  );
  const api = launch(process.execPath, [join(apiDirectory, 'dist/main.js')], {
    env: {
      ...process.env,
      DATABASE_URL: testUrl.toString(),
      PORT: String(apiPort),
    },
  });
  await ready(`http://127.0.0.1:${apiPort}/api/health`, api);
  const web = launch(
    process.execPath,
    [
      join(root, 'node_modules/@angular/cli/bin/ng.js'),
      'serve',
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
      '--proxy-config',
      proxyPath,
    ],
    { cwd: webDirectory },
  );
  await ready(`http://127.0.0.1:${webPort}/`, web);
  const result = await finished(
    launch(
      process.execPath,
      [
        join(root, 'node_modules/@playwright/test/cli.js'),
        'test',
        ...process.argv.slice(2),
      ],
      {
        env: {
          ...process.env,
          BROWSER_TEST_BASE_URL: `http://127.0.0.1:${webPort}`,
        },
      },
    ),
  );
  process.exitCode = result.code ?? 1;
} catch (error) {
  console.error(
    `Browser test setup failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
} finally {
  for (const child of children.reverse()) await stop(child);
  if (admin) {
    try {
      if (createdDatabase)
        await admin.query(`DROP DATABASE "${testDatabase}" WITH (FORCE)`);
    } finally {
      await admin.end();
    }
  }
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
}
