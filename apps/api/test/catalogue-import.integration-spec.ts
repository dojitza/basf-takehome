import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { importCatalogue } from '../src/catalogue-import.js';
import { runSeed as runSeedWithLogs } from '../src/catalogue-seed.js';

// Proposed boundary for the implementation: an importer accepting CSV, a
// database URL and an injectable import time. The SQL below assumes a Prisma
// Product model; names can change without changing the behavior under test.
const header =
  'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
const row = (
  sku: string,
  name = 'Example',
  status = 'Active',
  year = '2020',
  certifications = 'Vegan',
) =>
  `${sku},${name},Substance,Polymer,Coatings,Global,${certifications},${status},${year},Description`;
const csv = (...rows: string[]) => [header, ...rows].join('\n');
const times = [1, 2, 3, 4].map((day) => new Date(`2026-01-0${day}T12:00:00Z`));
const schema = `import_test_${randomUUID().replaceAll('-', '')}`;
let databaseUrl: string;
let pool: Pool;
let createdSchema = false;
let fixtureDirectory: string;

async function products() {
  return (await pool.query(`SELECT * FROM "${schema}"."Product" ORDER BY sku`))
    .rows;
}
function runSeed(options: Parameters<typeof runSeedWithLogs>[0]) {
  return runSeedWithLogs({ logDirectory: fixtureDirectory, ...options });
}
async function run(input: string, time: Date) {
  return importCatalogue({ databaseUrl, csv: input, now: time });
}

beforeAll(async () => {
  const configuredUrl = process.env['DATABASE_URL'];
  if (!configuredUrl)
    throw new Error(
      'DATABASE_URL must point to the isolated integration database',
    );
  const parsed = new URL(configuredUrl);
  if (
    parsed.pathname !== '/product_finder_test' ||
    parsed.port !== '5433' ||
    !['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname)
  ) {
    throw new Error(
      'Import tests only run on the isolated local integration database',
    );
  }
  fixtureDirectory = mkdtempSync(join(tmpdir(), 'product-finder-import-test-'));
  pool = new Pool({ connectionString: configuredUrl });
  await pool.query(`CREATE SCHEMA "${schema}"`);
  createdSchema = true;
  parsed.searchParams.set('schema', schema);
  databaseUrl = parsed.toString();
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
  const table = await pool.query('SELECT to_regclass($1) AS table_name', [
    `"${schema}"."Product"`,
  ]);
  if (!table.rows[0].table_name)
    throw new Error('Product migration has not been created');
});

afterAll(async () => {
  if (fixtureDirectory)
    rmSync(fixtureDirectory, { recursive: true, force: true });
  if (pool) {
    try {
      if (createdSchema) await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await pool.end();
    }
  }
});

beforeEach(async () => {
  await pool.query(`DELETE FROM "${schema}"."Product"`);
});

describe('catalogue snapshot persistence', () => {
  it('creates products on a migrated empty database and round-trips normalized values', async () => {
    await run(
      csv(row(' sku-a ', 'Name', 'Phase out', '2020', 'Vegan|Kosher')),
      times[0],
    );
    expect(await products()).toEqual([
      expect.objectContaining({
        sku: 'SKU-A',
        name: 'Name',
        status: 'PHASE_OUT',
        launchYear: 2020,
        certifications: ['Vegan', 'Kosher'],
        presentInLatestImport: true,
        createdAt: times[0],
        updatedAt: times[0],
        lastImportedAt: times[0],
      }),
    ]);
  });

  it('repeated snapshots preserve identity and data timestamps while advancing lastImportedAt', async () => {
    await run(csv(row('p-1')), times[0]);
    const [first] = await products();
    await run(csv(row('P-1')), times[1]);
    expect(await products()).toEqual([
      expect.objectContaining({
        id: first.id,
        sku: 'P-1',
        createdAt: times[0],
        updatedAt: times[0],
        lastImportedAt: times[1],
      }),
    ]);
  });

  it('updates existing data and clears fields that are now unknown', async () => {
    await run(csv(row('P-1', 'Original', 'Active', '2020', 'Vegan')), times[0]);
    const [first] = await products();
    await run(csv(row('p-1', '', 'Discontinued', 'n/a', '')), times[1]);
    expect(await products()).toEqual([
      expect.objectContaining({
        id: first.id,
        name: null,
        status: 'DISCONTINUED',
        launchYear: null,
        certifications: [],
        createdAt: times[0],
        updatedAt: times[1],
        lastImportedAt: times[1],
      }),
    ]);
  });

  it('marks missing products absent, keeps them unchanged while absent, and restores their identity when they return', async () => {
    await run(
      csv(row('P-1', 'First', 'Discontinued'), row('P-2', 'Second')),
      times[0],
    );
    const [first] = await products();
    await run(csv(row('P-2', 'Second')), times[1]);
    let [missing] = await products();
    expect(missing).toEqual(
      expect.objectContaining({
        id: first.id,
        name: 'First',
        status: 'DISCONTINUED',
        presentInLatestImport: false,
        createdAt: times[0],
        updatedAt: times[1],
        lastImportedAt: times[0],
      }),
    );
    await run(csv(row('P-2', 'Second')), times[2]);
    [missing] = await products();
    expect(missing).toEqual(
      expect.objectContaining({
        updatedAt: times[1],
        lastImportedAt: times[0],
      }),
    );
    await run(
      csv(row('P-1', 'Returned', 'Active'), row('P-2', 'Second')),
      times[3],
    );
    const [returned] = await products();
    expect(returned).toEqual(
      expect.objectContaining({
        id: first.id,
        name: 'Returned',
        status: 'ACTIVE',
        presentInLatestImport: true,
        createdAt: times[0],
        updatedAt: times[3],
        lastImportedAt: times[3],
      }),
    );
  });

  it('allows a later snapshot to move discontinued to active', async () => {
    await run(csv(row('P-1', 'Example', 'Discontinued')), times[0]);
    await run(csv(row('P-1', 'Example', 'Active')), times[1]);
    expect((await products())[0]).toEqual(
      expect.objectContaining({ status: 'ACTIVE', updatedAt: times[1] }),
    );
  });

  it('leaves all existing products and timestamps unchanged when a later row is invalid', async () => {
    await run(csv(row('P-1', 'First'), row('P-2', 'Second')), times[0]);
    const before = await products();
    await expect(
      run(csv(row('P-1', 'Changed'), row('', 'Invalid')), times[1]),
    ).rejects.toThrow();
    expect(await products()).toEqual(before);
  });

  it('rolls back inserts, updates and absences when a database error occurs at commit', async () => {
    await run(csv(row('P-1', 'First'), row('P-2', 'Second')), times[0]);
    const before = await products();
    await pool.query(
      `CREATE FUNCTION "${schema}".reject_test_product() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.name = 'FAIL-IMPORT' THEN RAISE EXCEPTION 'test deferred failure'; END IF; RETURN NEW; END $$`,
    );
    await pool.query(
      `CREATE CONSTRAINT TRIGGER reject_test_product AFTER INSERT OR UPDATE ON "${schema}"."Product" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_test_product()`,
    );
    try {
      await expect(
        run(csv(row('P-1', 'Changed'), row('P-3', 'FAIL-IMPORT')), times[1]),
      ).rejects.toThrow();
      expect(await products()).toEqual(before);
    } finally {
      await pool.query(
        `DROP TRIGGER reject_test_product ON "${schema}"."Product"`,
      );
      await pool.query(`DROP FUNCTION "${schema}".reject_test_product()`);
    }
  });
});

// The callable boundary makes warning/failure cases fast. A single subprocess
// below checks the actual documented command and its default input.
describe('seed command', () => {
  const fixture = (name: string, contents: string) => {
    const path = join(fixtureDirectory, name);
    writeFileSync(path, contents);
    return path;
  };

  it('runs the documented default command with the supplied export', async () => {
    const result = spawnSync(
      'npm',
      ['run', 'db:seed', '-w', '@product-finder/api'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          IMPORT_LOG_DIR: fixtureDirectory,
        },
        encoding: 'utf8',
      },
    );
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    expect(result.status).toBe(0);
    expect(output).toMatch(/200/);
    expect(output).toMatch(/P-10151/i);
    expect(output).toMatch(/discontinued/i);
    expect(await products()).toHaveLength(200);
  });

  it('succeeds with prominent conflict warnings and outcome counts', async () => {
    const path = fixture(
      'duplicate.csv',
      csv(
        row('P-1', 'Active', 'Active'),
        row('p-1', 'Stopped', 'Discontinued'),
        row('P-2', 'New'),
      ),
    );
    const result = await runSeed({ databaseUrl, filePath: path });
    const output = `${result.stdout}\n${result.stderr}`;
    expect(result.exitCode).toBe(0);
    expect(output).toMatch(/warn/i);
    expect(result.stderr).not.toContain('\x1b[');
    expect(output).toMatch(/P-1/i);
    expect(output).toMatch(/active/i);
    expect(output).toMatch(/discontinued/i);
    expect(output).toMatch(/rows?[^\d\r\n]*3|3[^\d\r\n]*rows?/i);
    expect(output).toMatch(/unique[^\d\r\n]*2|2[^\d\r\n]*unique/i);
    expect(output).toMatch(/duplicate|conflict/i);
    expect(output).toMatch(/creat/i);
    expect(await products()).toHaveLength(2);
  });

  it('limits each warning type in yellow console output and retains complete details in the log', async () => {
    const rows: string[] = [];
    for (let i = 1; i <= 5; i++) {
      rows.push(row(`P-${i}`, `Private first ${i}`, 'Active', 'bad-year'));
      rows.push(row(`P-${i}`, `Private second ${i}`, 'Discontinued'));
    }
    const path = fixture('many-warnings.csv', csv(...rows));
    const result = await runSeed({ databaseUrl, filePath: path, color: true });
    const log = readFileSync(result.logPath, 'utf8');
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('\x1b[33m');
    expect(result.stderr).toContain('\x1b[0m');
    expect(result.stderr).toMatch(/Conflicting duplicate \(5\)/);
    expect(result.stderr).toMatch(/Invalid launch year \(5\)/);
    expect(result.stderr.match(/\.\.\. and 2 more/g)).toHaveLength(2);
    expect(result.stderr).not.toContain('P-4');
    expect(result.stderr).not.toContain('Private first');
    expect(result.stderr).toContain(result.logPath);
    expect(log.match(/\[Conflicting duplicate\]/g)).toHaveLength(5);
    expect(log.match(/\[Invalid launch year\]/g)).toHaveLength(5);
    expect(log).toContain('Private first 5');
    expect(log).toContain('Private second 5');
    expect(log).not.toContain('\x1b[');
  });

  it('writes fatal diagnostics to the log and leaves redirected output uncolored', async () => {
    const path = fixture('bad-record.csv', csv(row('', 'Missing SKU')));
    const result = await runSeed({ databaseUrl, filePath: path });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(result.logPath);
    expect(result.stderr).not.toContain('\x1b[');
    expect(readFileSync(result.logPath, 'utf8')).toMatch(/missing SKU/i);
  });

  it('does not apply an import if the log cannot be created', async () => {
    await run(csv(row('P-1', 'Original')), times[0]);
    const before = await products();
    const input = fixture('would-change.csv', csv(row('P-1', 'Changed')));
    const notDirectory = fixture('not-a-directory', 'file');
    const result = await runSeed({
      databaseUrl,
      filePath: input,
      logDirectory: notDirectory,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/could not create log/i);
    expect(await products()).toEqual(before);
  });

  it('reports correct update, unchanged, creation and absence counts on the next snapshot', async () => {
    const first = fixture(
      'first.csv',
      csv(row('P-1', 'First'), row('P-2', 'Second'), row('P-3', 'Third')),
    );
    const second = fixture(
      'second.csv',
      csv(row('P-1', 'Changed'), row('P-2', 'Second'), row('P-4', 'New')),
    );
    expect((await runSeed({ databaseUrl, filePath: first })).exitCode).toBe(0);
    const result = await runSeed({ databaseUrl, filePath: second });
    const output = `${result.stdout}\n${result.stderr}`;
    expect(result.exitCode).toBe(0);
    for (const label of ['updated', 'unchanged', 'created', 'absent']) {
      expect(output).toMatch(
        new RegExp(`${label}[^\\d\\r\\n]*1|1[^\\d\\r\\n]*${label}`, 'i'),
      );
    }
    expect(await products()).toHaveLength(4);
  });

  it('fails actionably for unreadable or invalid input and preserves the previous catalogue', async () => {
    await run(csv(row('P-1')), times[0]);
    const before = await products();
    for (const path of [
      join(fixtureDirectory, 'missing.csv'),
      fixture('invalid.csv', csv(row('', 'Missing SKU'))),
    ]) {
      const result = await runSeed({ databaseUrl, filePath: path });
      expect(result.exitCode).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(
        /error|failed|invalid|missing/i,
      );
      expect(`${result.stdout}\n${result.stderr}`).not.toMatch(
        /import (completed|succeeded)/i,
      );
      expect(await products()).toEqual(before);
    }
  });

  it('reports a database failure as unsuccessful', async () => {
    const path = fixture('valid.csv', csv(row('P-1')));
    const badUrl = new URL(databaseUrl);
    badUrl.port = '1';
    const result = await runSeed({
      databaseUrl: badUrl.toString(),
      filePath: path,
    });
    expect(result.exitCode).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(
      /error|failed|database/i,
    );
    expect(`${result.stdout}\n${result.stderr}`).not.toMatch(
      /import (completed|succeeded)/i,
    );
  });
});
