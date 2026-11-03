import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DatabaseService } from '../src/database.service.js';
import { importCatalogue } from '../src/catalogue-import.js';

// Provisional HTTP contract for review. Product decisions are in the plan;
// changing this test adapter should not change the intended behaviors.
const endpoint = '/api/products';
const schema = `browse_test_${randomUUID().replaceAll('-', '')}`;
let app: INestApplication;
let database: PrismaClient;
let pool: Pool;
let databaseUrl: string;
let createdSchema = false;

type Item = {
  sku: string;
  name: string | null;
  status: string;
  presentInLatestImport: boolean;
  applicationArea: string | null;
  chemicalName: string | null;
  function: string | null;
};
type Page = {
  items: Item[];
  total: number;
  nextOffset: number | null;
  applicationAreas: string[];
};
const list = (
  query: Record<string, string | number | string[] | undefined> = {},
) => request(app.getHttpServer()).get(endpoint).query(query);
const skus = (page: Page) => page.items.map((item) => item.sku);

beforeAll(async () => {
  const configured = process.env['DATABASE_URL'];
  if (!configured)
    throw new Error('Isolated integration DATABASE_URL required');
  const parsed = new URL(configured);
  if (
    parsed.pathname !== '/product_finder_test' ||
    parsed.port !== '5433' ||
    !['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname)
  )
    throw new Error('Catalogue tests require the isolated local test database');
  pool = new Pool({ connectionString: configured });
  await pool.query(`CREATE SCHEMA "${schema}"`);
  createdSchema = true;
  parsed.searchParams.set('schema', schema);
  databaseUrl = parsed.toString();
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
  parsed.searchParams.delete('schema');
  database = new PrismaClient({
    adapter: new PrismaPg({ connectionString: parsed.toString() }, { schema }),
  });
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseService)
    .useValue(database)
    .compile();
  app = module.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
});

afterAll(async () => {
  if (app) await app.close();
  if (database) await database.$disconnect();
  if (pool) {
    try {
      if (createdSchema) await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await pool.end();
    }
  }
});

beforeEach(async () => {
  await database.product.deleteMany();
  const lastImportedAt = new Date('2026-01-01T12:00:00Z');
  await database.product.createMany({
    data: [
      {
        sku: 'P-001',
        name: 'Alpha',
        status: 'ACTIVE',
        applicationArea: 'Coatings',
        chemicalName: 'Acrylic dispersion',
        function: 'Binder',
        region: 'Europe',
        certifications: ['ISO 9001'],
        launchYear: 2021,
        description: 'Internal detail text',
        lastImportedAt,
      },
      {
        sku: 'P-002',
        name: 'Alpha',
        status: 'PHASE_OUT',
        applicationArea: 'Coatings',
        lastImportedAt,
      },
      {
        sku: 'P-003',
        name: 'Beta',
        status: 'DISCONTINUED',
        applicationArea: 'Agriculture',
        lastImportedAt,
      },
      {
        sku: 'P-004',
        name: 'Crème',
        status: 'UNKNOWN',
        applicationArea: 'Coatings',
        lastImportedAt,
      },
      {
        sku: 'P-005',
        name: null,
        status: 'ACTIVE',
        applicationArea: 'Food',
        lastImportedAt,
      },
      {
        sku: 'P-006',
        name: 'Old absent',
        status: 'ACTIVE',
        presentInLatestImport: false,
        applicationArea: 'Coatings',
        lastImportedAt,
      },
      {
        sku: 'P-007',
        name: 'Old discontinued',
        status: 'DISCONTINUED',
        presentInLatestImport: false,
        applicationArea: 'Coatings',
        lastImportedAt,
      },
      {
        sku: 'X-100',
        name: '100% Pure',
        status: 'ACTIVE',
        applicationArea: 'Food',
        lastImportedAt,
      },
      {
        sku: 'X-101',
        name: '100 Percent',
        status: 'ACTIVE',
        applicationArea: 'Food',
        lastImportedAt,
      },
    ],
  });
});

describe('catalogue read API against PostgreSQL', () => {
  it('returns a bounded summary, total, continuation and distinct application areas without internal fields', async () => {
    const response = await list().expect(200);
    expect(response.body).toEqual({
      items: expect.any(Array),
      total: 7,
      nextOffset: null,
      applicationAreas: ['Agriculture', 'Coatings', 'Food'],
    });
    const p001 = response.body.items.find((item: Item) => item.sku === 'P-001');
    expect(p001).toEqual({
      sku: 'P-001',
      name: 'Alpha',
      status: 'ACTIVE',
      presentInLatestImport: true,
      applicationArea: 'Coatings',
      chemicalName: 'Acrylic dispersion',
      function: 'Binder',
    });
    expect(Object.keys(p001).sort()).toEqual([
      'applicationArea',
      'chemicalName',
      'function',
      'name',
      'presentInLatestImport',
      'sku',
      'status',
    ]);
  });

  it('shows present products with their source status and excludes products missing from the latest snapshot', async () => {
    const response = await list({ limit: 20 }).expect(200);
    expect(skus(response.body)).toEqual(
      expect.arrayContaining(['P-001', 'P-002', 'P-003', 'P-004', 'P-005']),
    );
    expect(skus(response.body)).not.toContain('P-006');
    expect(
      response.body.items.find((item: Item) => item.sku === 'P-003'),
    ).toEqual(expect.objectContaining({ status: 'DISCONTINUED' }));
  });

  it.each([
    [' ALpHa ', ['P-001', 'P-002']],
    ['p-003', ['P-003']],
    ['crème', ['P-004']],
    ['not-a-product', []],
  ])(
    'matches name and SKU case-insensitively for %s',
    async (search, expected) => {
      const response = await list({ search, limit: 20 }).expect(200);
      expect(skus(response.body)).toEqual(expect.arrayContaining(expected));
      expect(response.body.items).toHaveLength(expected.length);
      expect(response.body.total).toBe(expected.length);
    },
  );

  it('treats wildcard, escape and query-like input as literal text', async () => {
    const percent = await list({ search: '100%', limit: 20 }).expect(200);
    expect(skus(percent.body)).toEqual(['X-100']);
    const underscore = await list({ search: 'P_001', limit: 20 }).expect(200);
    expect(underscore.body.items).toEqual([]);
    const backslash = await list({ search: '\\', limit: 20 }).expect(200);
    expect(backslash.body.items).toEqual([]);
    const injection = await list({ search: "' OR 1=1 --", limit: 20 }).expect(
      200,
    );
    expect(injection.body.items).toEqual([]);
  });

  it('filters statuses and combines search with the filter', async () => {
    const response = await list({
      search: 'alpha',
      status: 'PHASE_OUT',
      limit: 20,
    }).expect(200);
    expect(skus(response.body)).toEqual(['P-002']);
    expect(response.body.total).toBe(1);
  });

  it('groups unknown and absent as unavailable, while keeping discontinued separate', async () => {
    const unavailable = await list({ status: 'UNAVAILABLE', limit: 20 }).expect(
      200,
    );
    expect(skus(unavailable.body)).toEqual(
      expect.arrayContaining(['P-004', 'P-006', 'P-007']),
    );
    expect(unavailable.body.items).toHaveLength(3);
    expect(skus(unavailable.body)).not.toContain('P-003');
    const discontinued = await list({
      status: 'DISCONTINUED',
      limit: 20,
    }).expect(200);
    expect(skus(discontinued.body)).toEqual(['P-003']);
    expect(unavailable.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sku: 'P-004',
          status: 'UNKNOWN',
          presentInLatestImport: true,
        }),
        expect.objectContaining({
          sku: 'P-006',
          status: 'ACTIVE',
          presentInLatestImport: false,
        }),
        expect.objectContaining({
          sku: 'P-007',
          status: 'DISCONTINUED',
          presentInLatestImport: false,
        }),
      ]),
    );
    expect(
      await database.product.findUnique({
        where: { sku: 'P-007' },
        select: { status: true, presentInLatestImport: true },
      }),
    ).toEqual({ status: 'DISCONTINUED', presentInLatestImport: false });
  });

  it('combines unavailable and discontinued selections without merging their categories', async () => {
    const response = await list({
      status: ['UNAVAILABLE', 'DISCONTINUED'],
      limit: 20,
    }).expect(200);
    expect(skus(response.body)).toEqual(
      expect.arrayContaining(['P-003', 'P-004', 'P-006', 'P-007']),
    );
    expect(response.body.items).toHaveLength(4);
    expect(response.body.total).toBe(4);
  });

  it('filters application area and combines it with status and search', async () => {
    const coatings = await list({
      applicationArea: 'Coatings',
      limit: 20,
    }).expect(200);
    expect(skus(coatings.body)).toEqual(
      expect.arrayContaining(['P-001', 'P-002', 'P-004']),
    );
    expect(coatings.body.items).toHaveLength(3);
    const narrow = await list({
      search: 'alpha',
      applicationArea: 'Coatings',
      status: 'ACTIVE',
      limit: 20,
    }).expect(200);
    expect(skus(narrow.body)).toEqual(['P-001']);
    expect(narrow.body.total).toBe(1);
    const empty = await list({
      search: 'alpha',
      applicationArea: 'Food',
      limit: 20,
    }).expect(200);
    expect(empty.body.items).toEqual([]);
  });

  it('uses OR within a filter and AND across selected filter groups', async () => {
    const response = await list({
      status: ['ACTIVE', 'PHASE_OUT'],
      applicationArea: ['Coatings', 'Food'],
      limit: 20,
    }).expect(200);
    expect(skus(response.body)).toEqual(
      expect.arrayContaining(['P-001', 'P-002', 'P-005', 'X-100', 'X-101']),
    );
    expect(response.body.items).toHaveLength(5);
    expect(response.body.total).toBe(5);
  });

  it.each(['name', 'name-desc'])(
    'sorts %s with null names last, default equivalence, and a stable SKU tie-breaker',
    async (sort) => {
      const response = await list({ sort, limit: 20 }).expect(200);
      const ids = skus(response.body);
      expect(ids.at(-1)).toBe('P-005');
      expect(ids.indexOf('P-001')).toBeLessThan(ids.indexOf('P-002'));
      if (sort === 'name') {
        expect(ids).toEqual([
          'X-101',
          'X-100',
          'P-001',
          'P-002',
          'P-003',
          'P-004',
          'P-005',
        ]);
        const defaultSorted = await list({ limit: 20 }).expect(200);
        expect(skus(defaultSorted.body)).toEqual(ids);
      } else {
        expect(ids).toEqual([
          'P-004',
          'P-003',
          'P-001',
          'P-002',
          'X-100',
          'X-101',
          'P-005',
        ]);
      }
    },
  );

  it('sorts product names case-insensitively before breaking ties by SKU', async () => {
    await database.product.create({
      data: {
        sku: 'P-008',
        name: 'acorn',
        status: 'ACTIVE',
        applicationArea: 'Coatings',
        lastImportedAt: new Date('2026-01-01T12:00:00Z'),
      },
    });
    const response = await list({ sort: 'name', limit: 20 }).expect(200);
    const ids = skus(response.body);
    expect(ids.indexOf('P-008')).toBeLessThan(ids.indexOf('P-003'));
  });

  it('uses a stable SKU tie-breaker and returns every product exactly once across batches', async () => {
    const first = await list({
      search: 'alpha',
      sort: 'name',
      limit: 1,
      offset: 0,
    }).expect(200);
    const second = await list({
      search: 'alpha',
      sort: 'name',
      limit: 1,
      offset: first.body.nextOffset,
    }).expect(200);
    expect(skus(first.body)).toEqual(['P-001']);
    expect(skus(second.body)).toEqual(['P-002']);
    expect(first.body.total).toBe(2);
    expect(second.body.nextOffset).toBeNull();
  });

  it('traverses multiple batches without omitting or repeating matching products', async () => {
    let offset: number | null = 0;
    const seen: string[] = [];
    for (let pageNumber = 0; pageNumber < 10 && offset !== null; pageNumber++) {
      const response: { body: Page } = await list({
        sort: 'name',
        limit: 2,
        offset,
      }).expect(200);
      seen.push(...skus(response.body));
      expect(response.body.total).toBe(7);
      offset = response.body.nextOffset;
    }
    expect(offset).toBeNull();
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect(seen).toEqual(
      expect.arrayContaining([
        'P-001',
        'P-002',
        'P-003',
        'P-004',
        'P-005',
        'X-100',
        'X-101',
      ]),
    );
  });

  it.each([0, 1, 2, 3])(
    'handles result count %i around a two-item batch boundary',
    async (count) => {
      const query =
        count === 0
          ? { search: 'does-not-exist' }
          : count === 1
            ? { search: 'p-003' }
            : count === 2
              ? { search: 'alpha' }
              : { applicationArea: 'Coatings' };
      const response = await list({ ...query, limit: 2, offset: 0 }).expect(
        200,
      );
      expect(response.body.items).toHaveLength(Math.min(count, 2));
      expect(response.body.total).toBe(count);
      expect(response.body.nextOffset).toBe(count > 2 ? 2 : null);
    },
  );

  it('accepts the maximum batch limit of 100', async () => {
    const response = await list({ limit: 100, offset: 0 }).expect(200);
    expect(response.body.items).toHaveLength(7);
  });

  it.each([
    { limit: 0 },
    { limit: -1 },
    { limit: 'abc' },
    { limit: '10.5' },
    { limit: 101 },
    { limit: 10000 },
    { limit: ['10', '20'] },
    { offset: -1 },
    { offset: 'abc' },
    { offset: 1000001 },
    { offset: ['0', '1'] },
    { status: 'invented' },
    { status: ['ACTIVE', 'invented'] },
    { applicationArea: '   ' },
    { sort: 'invented' },
    { sort: ['name', 'name-desc'] },
    { search: ['a', 'b'] },
    { search: 'x'.repeat(500) },
  ])('rejects invalid query %j with a client error', async (query) => {
    await list(query).expect(400);
  });

  it('reflects absence and return after subsequent imports in fresh queries', async () => {
    const header =
      'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
    const product = (sku: string) =>
      `${sku},Name,Substance,Polymer,Coatings,Global,,Active,2020,Description`;
    await importCatalogue({
      databaseUrl,
      csv: [header, product('P-001')].join('\n'),
    });
    expect(skus((await list({ search: 'P-003' }).expect(200)).body)).toEqual(
      [],
    );
    await importCatalogue({
      databaseUrl,
      csv: [header, product('P-001'), product('P-003')].join('\n'),
    });
    expect(skus((await list({ search: 'P-003' }).expect(200)).body)).toEqual([
      'P-003',
    ]);
  });
});

describe('catalogue dependency failure', () => {
  it('returns a generic server error without exposing database details', async () => {
    const secret = 'internal-database-password';
    const failure = new Error(`database failed: ${secret}`);
    let calls = 0;
    const fail = async () => {
      calls++;
      throw failure;
    };
    const unavailable = {
      product: new Proxy({}, { get: () => fail }),
      $queryRaw: fail,
      $queryRawUnsafe: fail,
      $transaction: fail,
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(unavailable)
      .compile();
    const brokenApp = module.createNestApplication();
    brokenApp.setGlobalPrefix('api');
    await brokenApp.init();
    try {
      const response = await request(brokenApp.getHttpServer()).get(endpoint);
      expect(response.status).toBeGreaterThanOrEqual(500);
      expect(response.status).toBeLessThan(600);
      expect(calls).toBeGreaterThan(0);
      expect(JSON.stringify(response.body)).not.toContain(secret);
      expect(JSON.stringify(response.body)).not.toMatch(
        /stack|select .* from/i,
      );
    } finally {
      await brokenApp.close();
    }
  });
});
