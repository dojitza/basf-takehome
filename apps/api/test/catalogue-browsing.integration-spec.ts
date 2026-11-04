import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
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
  id: string;
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
    .useValue({
      schema,
      product: database.product,
      $queryRaw: database.$queryRaw.bind(database),
    })
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
      id: expect.any(String),
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
      'id',
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

describe('product details API against PostgreSQL', () => {
  it('includes the product identity in catalogue results', async () => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const product = await database.product.findUniqueOrThrow({
      where: { sku: 'P-001' },
    });
    const page = await list().expect(200);
    expect(page.body.items.length).toBeGreaterThan(0);
    for (const item of page.body.items as Item[]) {
      expect(item.id).toMatch(uuidPattern);
    }
    expect(
      page.body.items.find((item: Item) => item.sku === product.sku)?.id,
    ).toBe(product.id);
  });

  const detailKeys = [
    'applicationArea',
    'certifications',
    'chemicalName',
    'description',
    'function',
    'id',
    'launchYear',
    'name',
    'presentInLatestImport',
    'region',
    'sku',
    'status',
  ];

  it('returns all customer-facing fields without import metadata and preserves multiple certifications', async () => {
    const product = await database.product.update({
      where: { sku: 'P-001' },
      data: { certifications: ['ISO 9001', 'REACH', 'Halal'] },
    });
    const response = await request(app.getHttpServer())
      .get(`${endpoint}/${product.id}`)
      .expect(200);
    expect(response.body).toEqual({
      id: product.id,
      sku: 'P-001',
      name: 'Alpha',
      chemicalName: 'Acrylic dispersion',
      function: 'Binder',
      applicationArea: 'Coatings',
      region: 'Europe',
      certifications: ['ISO 9001', 'REACH', 'Halal'],
      status: 'ACTIVE',
      launchYear: 2021,
      description: 'Internal detail text',
      presentInLatestImport: true,
    });
    expect(Object.keys(response.body).sort()).toEqual(detailKeys);
  });

  it.each(['P-002', 'P-003', 'P-004', 'P-006', 'P-007'])(
    'retrieves %s regardless of status, absence or unrelated/invalid catalogue query parameters',
    async (sku) => {
      const product = await database.product.findUniqueOrThrow({
        where: { sku },
      });
      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${product.id}`)
        .query({
          search: 'not a match',
          status: 'BOGUS',
          sort: 'invalid',
          limit: 'abc',
          offset: '-1',
        })
        .expect(200);
      expect(response.body).toMatchObject({
        id: product.id,
        sku,
        status: product.status,
        presentInLatestImport: product.presentInLatestImport,
      });
      expect(Object.keys(response.body).sort()).toEqual(detailKeys);
    },
  );

  it('preserves missing values across all nullable fields for the UI to explain', async () => {
    const product = await database.product.update({
      where: { sku: 'P-005' },
      data: { applicationArea: null },
    });
    const response = await request(app.getHttpServer())
      .get(`${endpoint}/${product.id}`)
      .expect(200);
    expect(response.body).toEqual({
      id: product.id,
      sku: 'P-005',
      name: null,
      chemicalName: null,
      function: null,
      applicationArea: null,
      region: null,
      certifications: [],
      status: 'ACTIVE',
      launchYear: null,
      description: null,
      presentInLatestImport: true,
    });
    expect(Object.keys(response.body).sort()).toEqual(detailKeys);
  });

  it('accepts uppercase and mixed-case UUID representations for an existing product', async () => {
    const product = await database.product.findUniqueOrThrow({
      where: { sku: 'P-001' },
    });
    const upper = product.id.toUpperCase();
    const mixed = [...product.id]
      .map((ch, idx) => (idx % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase()))
      .join('');
    for (const candidate of [upper, mixed]) {
      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${candidate}`)
        .expect(200);
      expect(response.body.id).toBe(product.id);
      expect(response.body.sku).toBe('P-001');
    }
  });

  it('returns domain 404 (not route-missing Cannot GET) for malformed or absent identities, including property-generated invalid IDs', async () => {
    // Insert a synthetic non-UUID primary key directly via SQL to prove the API
    // validates UUID format rather than blindly querying arbitrary text primary keys.
    await pool.query(
      `INSERT INTO "${schema}"."Product" (id, sku, status, "presentInLatestImport", certifications, "createdAt", "updatedAt", "lastImportedAt") VALUES ($1, $2, 'ACTIVE', true, '{}', NOW(), NOW(), NOW())`,
      ['not-a-uuid-pk', 'P-NON-UUID'],
    );
    let seed = 0x5eed1234;
    const nextRand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const alphabet =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~.!$&()*+,;=@%';
    const generatedInvalidIds = Array.from({ length: 20 }, (_, index) => {
      const len = 1 + Math.floor(nextRand() * 45);
      let out = '';
      for (let i = 0; i < len; i++) {
        out += alphabet[Math.floor(nextRand() * alphabet.length)];
      }
      return `invalid-${index}-${out}`;
    });
    const malformedAndAbsent = [
      randomUUID(),
      'invalid',
      'not-a-uuid-pk',
      'P-001',
      '12345',
      '00000000-0000-0000-0000-00000000000g',
      '00000000-0000-4000-8000-00000000000',
      '00000000-0000-4000-8000-0000000000000',
      '00000000000040008000000000000000',
      "' OR 1=1 --",
      ...generatedInvalidIds,
    ];
    for (const candidate of malformedAndAbsent) {
      const response = await request(app.getHttpServer())
        .get(`${endpoint}/${encodeURIComponent(candidate)}`)
        .expect(404);
      expect(String(response.body?.message ?? '')).not.toMatch(/^Cannot GET /i);
      expect(JSON.stringify(response.body)).not.toMatch(
        /stack|prisma|select .* from/i,
      );
    }
  });

  it('keeps a link valid across an absent snapshot and a later case-insensitive return with updated fields', async () => {
    const original = await database.product.findUniqueOrThrow({
      where: { sku: 'P-003' },
    });
    const header =
      'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
    const row = (
      sku: string,
      status = 'Active',
      name = 'Name',
      certs = '',
      year = '2020',
      desc = 'Description',
    ) =>
      `${sku},${name},Substance,Polymer,Coatings,Global,${certs},${status},${year},${desc}`;
    await importCatalogue({
      databaseUrl,
      csv: [header, row('P-001')].join('\n'),
    });
    const absent = await request(app.getHttpServer())
      .get(`${endpoint}/${original.id}`)
      .expect(200);
    expect(absent.body).toMatchObject({
      id: original.id,
      sku: 'P-003',
      status: 'DISCONTINUED',
      presentInLatestImport: false,
    });
    await importCatalogue({
      databaseUrl,
      csv: [
        header,
        row('P-001'),
        row(
          '  p-003  ',
          'Phase-out',
          'Returned Beta',
          'ISO 9001|EcoCert',
          '2024',
          'Updated description',
        ),
      ].join('\n'),
    });
    const returned = await request(app.getHttpServer())
      .get(`${endpoint}/${original.id}`)
      .expect(200);
    expect(returned.body).toEqual({
      id: original.id,
      sku: 'P-003',
      name: 'Returned Beta',
      chemicalName: 'Substance',
      function: 'Polymer',
      applicationArea: 'Coatings',
      region: 'Global',
      certifications: ['ISO 9001', 'EcoCert'],
      status: 'PHASE_OUT',
      launchYear: 2024,
      description: 'Updated description',
      presentInLatestImport: true,
    });
  });

  it('serves consistent product details without false 404s or 500s during concurrent imports and reads', async () => {
    const p001 = await database.product.findUniqueOrThrow({
      where: { sku: 'P-001' },
    });
    const p003 = await database.product.findUniqueOrThrow({
      where: { sku: 'P-003' },
    });
    const header =
      'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
    const csvWithoutP003 = [
      header,
      'P-001,Alpha v2,Acrylic dispersion,Binder,Coatings,Europe,ISO 9001,Active,2021,Updated text',
    ].join('\n');
    const csvWithP003 = [
      header,
      'P-001,Alpha v3,Acrylic dispersion,Binder,Coatings,Europe,ISO 9001,Active,2021,Updated text 3',
      'P-003,Beta Returned,Substance,Additive,Agriculture,Global,REACH,Phase-out,2022,Restored text',
    ].join('\n');

    const reads = Array.from({ length: 12 }, (_, idx) =>
      request(app.getHttpServer()).get(
        `${endpoint}/${idx % 2 === 0 ? p001.id : p003.id}`,
      ),
    );
    const listReads = Array.from({ length: 4 }, () => list({ limit: 20 }));
    const imports = (async () => {
      await importCatalogue({ databaseUrl, csv: csvWithoutP003 });
      await importCatalogue({ databaseUrl, csv: csvWithP003 });
    })();

    const [detailResponses, listResponses] = await Promise.all([
      Promise.all(reads),
      Promise.all(listReads),
      imports,
    ]);

    for (const res of detailResponses) {
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).sort()).toEqual(detailKeys);
      expect([p001.id, p003.id]).toContain(res.body.id);
    }
    for (const res of listResponses) {
      expect(res.status).toBe(200);
      for (const item of res.body.items as Item[]) {
        expect(typeof item.id).toBe('string');
      }
    }
  });
});

describe('product detail dependency failure', () => {
  it.each([
    [
      'generic error',
      (secret: string) => new Error(`database failed: ${secret}`),
    ],
    [
      'Prisma known request error (P1001 unreachable)',
      (secret: string) =>
        new Prisma.PrismaClientKnownRequestError(secret, {
          code: 'P1001',
          clientVersion: '7.10.1',
        }),
    ],
    [
      'Prisma initialization error',
      (secret: string) =>
        new Prisma.PrismaClientInitializationError(secret, '7.10.1'),
    ],
  ])(
    'returns a generic server error rather than 404 or internal details on %s',
    async (_label, makeError) => {
      const secret = 'private-detail-error-secret';
      let calls = 0;
      const fail = async () => {
        calls++;
        throw makeError(secret);
      };
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(DatabaseService)
        .useValue({
          schema,
          product: new Proxy({}, { get: () => fail }),
          $queryRaw: fail,
          $queryRawUnsafe: fail,
          $transaction: fail,
        })
        .compile();
      const brokenApp = module.createNestApplication();
      brokenApp.setGlobalPrefix('api');
      await brokenApp.init();
      try {
        const response = await request(brokenApp.getHttpServer()).get(
          `${endpoint}/${randomUUID()}`,
        );
        expect(response.status).toBeGreaterThanOrEqual(500);
        expect(response.status).toBeLessThan(600);
        expect(calls).toBeGreaterThan(0);
        expect(JSON.stringify(response.body)).not.toContain(secret);
        expect(JSON.stringify(response.body)).not.toMatch(
          /stack|select .* from|prisma/i,
        );
      } finally {
        await brokenApp.close();
      }
    },
  );
});
