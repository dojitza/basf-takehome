import { jest } from '@jest/globals';
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

// Agreed response contract: { items, nextCursor, summary: { count, average } }.
const schema = `reviews_test_${randomUUID().replaceAll('-', '')}`;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let app: INestApplication;
let db: PrismaClient;
let pool: Pool;
let databaseUrl: string;
let productId: string;
let createdSchema = false;

const url = (id = productId) => `/api/products/${id}/reviews`;
const payload = (overrides: Record<string, unknown> = {}) => ({
  submissionId: randomUUID(),
  rating: 4,
  reviewerName: 'Alex',
  comment: 'Useful',
  ...overrides,
});
const post = (body: unknown, path = url()) =>
  request(app.getHttpServer())
    .post(path)
    .set('Content-Type', 'application/json')
    .send(body as string | object);
const get = (query: Record<string, unknown> = {}, path = url()) =>
  request(app.getHttpServer()).get(path).query(query);

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
    throw new Error('Reviews tests require the isolated local test database');
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
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: parsed.toString() }, { schema }),
  });
  Object.assign(db, { schema });
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DatabaseService)
    .useValue(db)
    .compile();
  app = module.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
});

afterAll(async () => {
  if (app) await app.close();
  if (db) await db.$disconnect();
  if (pool) {
    try {
      if (createdSchema) await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
    } finally {
      await pool.end();
    }
  }
});

beforeEach(async () => {
  const product = await db.product.create({
    data: {
      sku: randomUUID(),
      name: 'Review fixture',
      status: 'ACTIVE',
      certifications: [],
      lastImportedAt: new Date(),
    },
  });
  productId = product.id;
});

describe('product reviews HTTP and PostgreSQL contract', () => {
  it('enforces rating 1..5 check, product foreign key, unique submissionId, and ordering index in PostgreSQL', async () => {
    const validId = randomUUID();
    const validSubmissionId = randomUUID();
    await pool.query(
      `INSERT INTO "${schema}"."Review" (id, "productId", rating, "reviewerName", comment, "createdAt", "submissionId")
       VALUES ($1, $2, 5, 'DB Check', 'Direct row', NOW(), $3)`,
      [validId, productId, validSubmissionId],
    );

    // Out-of-range ratings must be rejected by PostgreSQL CHECK constraint (code 23514).
    for (const invalidRating of [0, 6, -3]) {
      await expect(
        pool.query(
          `INSERT INTO "${schema}"."Review" (id, "productId", rating, "createdAt", "submissionId")
           VALUES ($1, $2, $3, NOW(), $4)`,
          [randomUUID(), productId, invalidRating, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    }

    // Duplicate submissionId must be rejected by PostgreSQL UNIQUE constraint (code 23505).
    await expect(
      pool.query(
        `INSERT INTO "${schema}"."Review" (id, "productId", rating, "createdAt", "submissionId")
         VALUES ($1, $2, 4, NOW(), $3)`,
        [randomUUID(), productId, validSubmissionId],
      ),
    ).rejects.toMatchObject({ code: '23505' });

    // Nonexistent productId must be rejected by PostgreSQL FOREIGN KEY constraint (code 23503).
    await expect(
      pool.query(
        `INSERT INTO "${schema}"."Review" (id, "productId", rating, "createdAt", "submissionId")
         VALUES ($1, $2, 4, NOW(), $3)`,
        [randomUUID(), randomUUID(), randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23503' });

    // The pagination index orders both cursor columns descending.
    const indexes = await pool.query<{ indexdef: string }>(
      `SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'Review'`,
      [schema],
    );
    expect(indexes.rows.map((row) => row.indexdef)).toContainEqual(
      expect.stringMatching(/\("productId", "createdAt" DESC, id DESC\)/),
    );
  });

  it('returns an empty summary and list for a product with no reviews, supporting uppercase UUIDs', async () => {
    const response = await get({}, url(productId.toUpperCase())).expect(200);
    expect(Object.keys(response.body).sort()).toEqual([
      'items',
      'nextCursor',
      'summary',
    ]);
    expect(response.body).toEqual({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
  });

  it('stores a rating alone, trims and normalizes blank text to null, and calculates summary across all reviews', async () => {
    const first = await post({
      submissionId: randomUUID(),
      rating: 1,
      reviewerName: '   ',
      comment: '\n\t  ',
    }).expect(201);

    expect(Object.keys(first.body).sort()).toEqual([
      'comment',
      'createdAt',
      'id',
      'rating',
      'reviewerName',
    ]);
    expect(first.body.id).toMatch(UUID_REGEX);
    expect(first.body.rating).toBe(1);
    expect(first.body.reviewerName).toBeNull();
    expect(first.body.comment).toBeNull();
    expect(Number.isNaN(Date.parse(first.body.createdAt))).toBe(false);

    const second = await post(
      {
        submissionId: randomUUID(),
        rating: 4,
        reviewerName: '  Alex M.  ',
        comment: '\n  Good dispersion  \t',
      },
      url(productId.toUpperCase()),
    ).expect(201);
    expect(second.body.reviewerName).toBe('Alex M.');
    expect(second.body.comment).toBe('Good dispersion');

    // Also allow omitting optional reviewerName and comment completely.
    await post({
      submissionId: randomUUID(),
      rating: 4,
    }).expect(201);

    // Create a review on a different product to ensure summary and list are strictly per-product.
    const otherProduct = await db.product.create({
      data: {
        sku: randomUUID(),
        name: 'Other product',
        status: 'ACTIVE',
        certifications: [],
        lastImportedAt: new Date(),
      },
    });
    await post(payload({ rating: 5 }), url(otherProduct.id)).expect(201);

    const paged = await get({ limit: 1 }).expect(200);
    expect(paged.body.items).toHaveLength(1);
    expect(paged.body.summary).toEqual({ count: 3, average: 3 });

    const all = await get().expect(200);
    expect(all.body.items).toHaveLength(3);
    for (const item of all.body.items) {
      expect(Object.keys(item).sort()).toEqual([
        'comment',
        'createdAt',
        'id',
        'rating',
        'reviewerName',
      ]);
    }
    expect(all.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rating: 1,
          reviewerName: null,
          comment: null,
        }),
        expect.objectContaining({
          rating: 4,
          reviewerName: 'Alex M.',
          comment: 'Good dispersion',
        }),
      ]),
    );
  });

  it.each([0, 6, -1, 1.5, '5', null, undefined, true, NaN])(
    'rejects invalid rating %j with 400 without persisting a review',
    async (rating) => {
      await post(payload({ rating })).expect(400);
      const current = await get().expect(200);
      expect(current.body.summary.count).toBe(0);
    },
  );

  it.each([
    ['reviewerName > 100 chars', { reviewerName: 'x'.repeat(101) }],
    [
      'trimmed reviewerName > 100 chars',
      { reviewerName: `  ${'x'.repeat(101)}  ` },
    ],
    ['comment > 1000 chars', { comment: 'x'.repeat(1001) }],
    ['trimmed comment > 1000 chars', { comment: `\n${'x'.repeat(1001)}\t` }],
    ['numeric reviewerName', { reviewerName: 7 }],
    ['object reviewerName', { reviewerName: { name: 'Alex' } }],
    ['array comment', { comment: [] }],
    ['boolean comment', { comment: false }],
    ['invalid submissionId string', { submissionId: 'invalid' }],
    ['empty submissionId', { submissionId: '' }],
    ['missing submissionId', { submissionId: undefined }],
    ['null submissionId', { submissionId: null }],
    ['unknown extra field', { unknownField: 'unexpected' }],
    ['injected id field', { id: randomUUID() }],
    ['injected productId field', { productId: randomUUID() }],
    ['injected createdAt field', { createdAt: '2020-01-01T00:00:00.000Z' }],
  ])('rejects invalid input (%s) with 400', async (_label, invalid) => {
    await post(payload(invalid)).expect(400);
    const current = await get().expect(200);
    expect(current.body.summary.count).toBe(0);
  });

  it('rejects non-object request bodies with 400', async () => {
    await post(['not', 'an', 'object']).expect(400);
  });

  it('accepts maximum trimmed text lengths (including surrounding whitespace) and both rating boundaries', async () => {
    const maxName = 'N'.repeat(100);
    const maxComment = 'C'.repeat(1000);
    const saved = await post(
      payload({
        rating: 1,
        reviewerName: `  ${maxName}\n`,
        comment: `\t${maxComment}  `,
      }),
    ).expect(201);
    expect(saved.body.reviewerName).toBe(maxName);
    expect(saved.body.comment).toBe(maxComment);

    await post(
      payload({
        rating: 5,
        reviewerName: null,
        comment: null,
      }),
    ).expect(201);
  });

  it.each([
    ['ACTIVE', true],
    ['PHASE_OUT', true],
    ['DISCONTINUED', true],
    ['UNKNOWN', true],
    ['ACTIVE', false],
    ['DISCONTINUED', false],
  ] as const)(
    'allows reading and submitting reviews when product status is %s and presentInLatestImport is %s',
    async (status, presentInLatestImport) => {
      const target = await db.product.create({
        data: {
          sku: randomUUID(),
          name: `${status}-${presentInLatestImport}`,
          status,
          presentInLatestImport,
          certifications: [],
          lastImportedAt: new Date(),
        },
      });
      await post(
        payload({ rating: 5, comment: `Review on ${status}` }),
        url(target.id),
      ).expect(201);
      const read = await get({}, url(target.id)).expect(200);
      expect(read.body.summary).toEqual({ count: 1, average: 5 });
      expect(read.body.items[0].comment).toBe(`Review on ${status}`);
    },
  );

  it('returns domain 404 for malformed, non-UUID primary key, and missing products without accepting a review', async () => {
    const nonUuidId = `custom-text-pk-${randomUUID().slice(0, 8)}`;
    await pool.query(
      `INSERT INTO "${schema}"."Product" (id, sku, name, status, certifications, "presentInLatestImport", "createdAt", "updatedAt", "lastImportedAt")
       VALUES ($1, $2, 'Non-UUID Product', 'ACTIVE'::"${schema}"."ProductStatus", '{}', true, NOW(), NOW(), NOW())`,
      [nonUuidId, `SKU-${nonUuidId}`],
    );

    for (const id of [
      'bad-id',
      '12345',
      nonUuidId,
      '00000000-0000-0000-0000-000000000000',
      randomUUID(),
    ]) {
      const read = await get({}, `/api/products/${id}/reviews`).expect(404);
      const write = await post(payload(), `/api/products/${id}/reviews`).expect(
        404,
      );
      expect(JSON.stringify(read.body)).not.toMatch(/Cannot GET/i);
      expect(JSON.stringify(write.body)).not.toMatch(/Cannot POST/i);
    }
  });

  it('replays concurrent and normalized-equivalent identical submissions once and rejects conflicting reuse across any field or product', async () => {
    const submissionId = randomUUID();
    const initialBody = {
      submissionId,
      rating: 4,
      reviewerName: '  Alex  ',
      comment: '   ',
    };

    // Concurrent burst with same submissionId (including uppercase UUID variant)
    const burst = await Promise.all([
      post(initialBody),
      post(initialBody),
      post({ ...initialBody, submissionId: submissionId.toUpperCase() }),
      post(initialBody),
      post(initialBody),
      post(initialBody),
    ]);
    for (const res of burst) {
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
      expect(res.body.id).toBe(burst[0].body.id);
      expect(res.body.reviewerName).toBe('Alex');
      expect(res.body.comment).toBeNull();
    }

    // Sequential replay with normalized-equivalent values ('Alex' and null/omitted comment)
    const replay = await post({
      submissionId,
      rating: 4,
      reviewerName: 'Alex',
      comment: null,
    });
    expect(replay.status).toBeGreaterThanOrEqual(200);
    expect(replay.status).toBeLessThan(300);
    expect(replay.body.id).toBe(burst[0].body.id);

    // Conflicts on rating, reviewerName, comment, or productId must return 409
    await post({
      submissionId,
      rating: 5,
      reviewerName: 'Alex',
      comment: null,
    }).expect(409);
    await post({
      submissionId,
      rating: 4,
      reviewerName: 'Different Name',
      comment: null,
    }).expect(409);
    await post({
      submissionId,
      rating: 4,
      reviewerName: null,
      comment: null,
    }).expect(409);
    await post({
      submissionId,
      rating: 4,
      reviewerName: 'Alex',
      comment: 'Changed comment',
    }).expect(409);

    const other = await db.product.create({
      data: {
        sku: randomUUID(),
        status: 'DISCONTINUED',
        certifications: [],
        lastImportedAt: new Date(),
      },
    });
    await post(
      {
        submissionId,
        rating: 4,
        reviewerName: 'Alex',
        comment: null,
      },
      url(other.id),
    ).expect(409);

    const list = await get().expect(200);
    expect(list.body.summary.count).toBe(1);
    expect(list.body.items[0]).toMatchObject({
      id: burst[0].body.id,
      rating: 4,
      reviewerName: 'Alex',
      comment: null,
    });
  });

  it('defaults to batch size 10, accepts limit up to 100, and paginates deterministically across identical createdAt timestamp ties', async () => {
    // Create 12 reviews; force 4 of them to share the exact same timestamp to exercise (createdAt DESC, id DESC) tie-breaking.
    const createdIds: string[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await post(
        payload({
          rating: (i % 5) + 1,
          comment: `review-${i}`,
        }),
      ).expect(201);
      createdIds.push(res.body.id as string);
    }

    const tiedTimestamp = '2026-02-01T12:00:00.000Z';
    const tiedIds = createdIds.slice(0, 4);
    await pool.query(
      `UPDATE "${schema}"."Review" SET "createdAt" = $1::timestamptz WHERE id = ANY($2::text[])`,
      [tiedTimestamp, tiedIds],
    );
    for (let i = 4; i < 12; i++) {
      const ts = new Date(
        Date.parse('2026-02-02T00:00:00.000Z') + i * 1000,
      ).toISOString();
      await pool.query(
        `UPDATE "${schema}"."Review" SET "createdAt" = $1::timestamptz WHERE id = $2`,
        [ts, createdIds[i]],
      );
    }

    // Default limit (omitted) must return 10 items and a continuation cursor.
    const defaultBatch = await get().expect(200);
    expect(defaultBatch.body.items).toHaveLength(10);
    expect(defaultBatch.body.nextCursor).toBeTruthy();
    expect(defaultBatch.body.summary.count).toBe(12);

    const remainderBatch = await get({
      cursor: defaultBatch.body.nextCursor,
    }).expect(200);
    expect(remainderBatch.body.items).toHaveLength(2);
    expect(remainderBatch.body.nextCursor).toBeNull();

    // Limit 100 must return all 12 items in exact (createdAt DESC, id DESC) order.
    const full = await get({ limit: 100 }).expect(200);
    expect(full.body.items).toHaveLength(12);
    expect(full.body.nextCursor).toBeNull();

    const expectedOrder = [
      ...createdIds.slice(4).reverse(),
      ...[...tiedIds].sort((a, b) => b.localeCompare(a)),
    ];
    expect(full.body.items.map((item: { id: string }) => item.id)).toEqual(
      expectedOrder,
    );

    // Step through the tied timestamp boundary 1 item at a time using cursor pagination.
    const collectedIds: string[] = [];
    let cursor: string | null = null;
    while (true) {
      const page = await get({
        limit: 1,
        ...(cursor ? { cursor } : {}),
      }).expect(200);
      expect(page.body.items).toHaveLength(1);
      collectedIds.push(page.body.items[0].id as string);
      cursor = page.body.nextCursor as string | null;
      if (!cursor) break;
      expect(collectedIds.length).toBeLessThan(12);
    }
    expect(collectedIds).toEqual(expectedOrder);
  });

  it('continues a cursor without duplicates when a newer review is inserted', async () => {
    for (let i = 0; i < 3; i++)
      await post(payload({ comment: `original ${i}` })).expect(201);
    const first = await get({ limit: 2 }).expect(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toBeTruthy();
    await post(payload({ comment: 'new' })).expect(201);
    const second = await get({
      limit: 2,
      cursor: first.body.nextCursor,
    }).expect(200);
    const ids = [...first.body.items, ...second.body.items].map(
      (item: { id: string }) => item.id,
    );
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(
      second.body.items.map((item: { comment: string }) => item.comment),
    ).not.toContain('new');
    expect(second.body.summary.count).toBe(4);
  });

  it.each([
    { limit: 0 },
    { limit: -1 },
    { limit: 101 },
    { limit: 'bad' },
    { limit: '10.5' },
    { limit: ['5', '10'] },
    { cursor: 'invalid' },
    { cursor: '' },
    { cursor: ['a', 'b'] },
    {
      cursor: Buffer.from(
        JSON.stringify({ createdAt: 'not-a-date', id: 'not-a-uuid' }),
      ).toString('base64url'),
    },
  ])('rejects invalid pagination %j with 400', async (query) => {
    await get(query).expect(400);
  });

  it('preserves reviews across complete imports, including absence and return', async () => {
    const product = await db.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const firstReview = await post(
      payload({ rating: 5, reviewerName: 'Ada', comment: 'Before import' }),
    ).expect(201);
    const header =
      'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
    const row = (sku: string) =>
      `${sku},Name,Substance,Polymer,Coatings,Global,,Active,2020,Description`;
    await importCatalogue({
      databaseUrl,
      csv: [header, row('OTHER')].join('\n'),
    });
    const absentReview = await post(
      payload({ rating: 3, reviewerName: null, comment: 'while absent' }),
    ).expect(201);
    const duringAbsence = await get().expect(200);
    expect(duringAbsence.body.summary).toEqual({ count: 2, average: 4 });

    await importCatalogue({
      databaseUrl,
      csv: [header, row(product.sku)].join('\n'),
    });
    const afterReturn = await get().expect(200);
    expect(afterReturn.body.summary).toEqual({ count: 2, average: 4 });
    expect(afterReturn.body.items).toEqual([
      expect.objectContaining({
        id: absentReview.body.id,
        rating: 3,
        reviewerName: null,
        comment: 'while absent',
      }),
      expect.objectContaining({
        id: firstReview.body.id,
        rating: 5,
        reviewerName: 'Ada',
        comment: 'Before import',
      }),
    ]);
  });

  it('returns a generic 5xx error without leaking database internals when Prisma fails on review reads or writes', async () => {
    const faultError = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at `db.internal:5432` (password=secret)",
      { code: 'P1001', clientVersion: '7.10.1' },
    );
    const reviewDelegate = (db as unknown as Record<string, unknown>)[
      'review'
    ] as Record<string, unknown> | undefined;
    expect(reviewDelegate).toBeDefined();

    const spies = [
      jest.spyOn(db, '$queryRaw').mockRejectedValue(faultError),
      jest.spyOn(db.product, 'findUnique').mockRejectedValue(faultError),
    ];
    if (reviewDelegate && typeof reviewDelegate['findMany'] === 'function') {
      spies.push(
        jest
          .spyOn(
            reviewDelegate as { findMany: () => Promise<unknown> },
            'findMany',
          )
          .mockRejectedValue(faultError),
      );
    }
    try {
      const readRes = await get();
      expect(readRes.status).toBeGreaterThanOrEqual(500);
      expect(JSON.stringify(readRes.body)).not.toMatch(
        /db\.internal|password=secret|P1001|SELECT/i,
      );

      const writeRes = await post(payload());
      expect(writeRes.status).toBeGreaterThanOrEqual(500);
      expect(JSON.stringify(writeRes.body)).not.toMatch(
        /db\.internal|password=secret|P1001|INSERT/i,
      );
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
