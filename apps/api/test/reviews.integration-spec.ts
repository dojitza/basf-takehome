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

// Provisional response adapter: {items, nextCursor, summary: {count, average}}.
// The behavior is agreed; names can be changed consistently when the API is designed.
const schema = `reviews_test_${randomUUID().replaceAll('-', '')}`;
let app: INestApplication;
let db: PrismaClient;
let pool: Pool;
let databaseUrl: string;
let productId: string;
let createdSchema = false;
const url = () => `/api/products/${productId}/reviews`;
const payload = (overrides: Record<string, unknown> = {}) => ({
  submissionId: randomUUID(),
  rating: 4,
  reviewerName: 'Alex',
  comment: 'Useful',
  ...overrides,
});
const post = (body: unknown, path = url()) =>
  request(app.getHttpServer()).post(path).send(body);
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
  // Fresh product identities isolate tests even after the review table exists.
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

describe('product reviews HTTP contract', () => {
  it('returns an empty summary and list for a product with no reviews', async () => {
    const response = await get().expect(200);
    expect(response.body).toMatchObject({
      items: [],
      nextCursor: null,
      summary: { count: 0, average: null },
    });
  });
  it('stores a rating alone, normalizes blank text, and calculates summary from all reviews', async () => {
    await post(
      payload({ rating: 1, reviewerName: '  ', comment: '\n ' }),
    ).expect(201);
    await post(
      payload({ rating: 4, reviewerName: '  Alex  ', comment: '  Good  ' }),
    ).expect(201);
    const response = await get({ limit: 1 }).expect(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.summary).toEqual({ count: 2, average: 2.5 });
    const all = await get().expect(200);
    expect(all.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rating: 1,
          reviewerName: null,
          comment: null,
        }),
        expect.objectContaining({
          rating: 4,
          reviewerName: 'Alex',
          comment: 'Good',
        }),
      ]),
    );
  });
  it.each([0, 6, -1, 1.5, '5', null])(
    'rejects invalid rating %j',
    async (rating) => {
      await post(payload({ rating })).expect(400);
    },
  );
  it.each([
    { reviewerName: 'x'.repeat(101) },
    { comment: 'x'.repeat(1001) },
    { reviewerName: 7 },
    { comment: [] },
    { submissionId: 'invalid' },
  ])('rejects invalid input %j', async (invalid) => {
    await post(payload(invalid)).expect(400);
  });
  it('accepts maximum text lengths and both rating boundaries', async () => {
    await post(
      payload({
        rating: 1,
        reviewerName: 'x'.repeat(100),
        comment: 'x'.repeat(1000),
      }),
    ).expect(201);
    await post(payload({ rating: 5 })).expect(201);
  });
  it('returns 404 for malformed and missing products without accepting a review', async () => {
    for (const id of ['bad-id', randomUUID()]) {
      const read = await get({}, `/api/products/${id}/reviews`).expect(404);
      const write = await post(payload(), `/api/products/${id}/reviews`).expect(
        404,
      );
      expect(JSON.stringify(read.body)).not.toMatch(/Cannot GET/i);
      expect(JSON.stringify(write.body)).not.toMatch(/Cannot POST/i);
    }
  });
  it('replays concurrent identical submissions once and rejects conflicting reuse', async () => {
    const body = payload();
    const responses = await Promise.all([post(body), post(body)]);
    expect(responses.every((r) => r.status >= 200 && r.status < 300)).toBe(
      true,
    );
    expect(responses[0].body.id).toEqual(responses[1].body.id);
    await post({ ...body, comment: 'Changed' }).expect(409);
    const list = await get().expect(200);
    expect(list.body.summary.count).toBe(1);
    const other = await db.product.create({
      data: {
        sku: randomUUID(),
        status: 'DISCONTINUED',
        certifications: [],
        lastImportedAt: new Date(),
      },
    });
    await post(body, `/api/products/${other.id}/reviews`).expect(409);
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
    { limit: 101 },
    { limit: 'bad' },
    { cursor: 'invalid' },
  ])('rejects invalid pagination %j', async (query) => {
    await get(query).expect(400);
  });
  it('preserves reviews across complete imports, including absence and return', async () => {
    const product = await db.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const body = payload();
    await post(body).expect(201);
    const header =
      'sku,name,chemical_name,function,application_area,region,certifications,status,launch_year,description';
    const row = (sku: string) =>
      `${sku},Name,Substance,Polymer,Coatings,Global,,Active,2020,Description`;
    await importCatalogue({
      databaseUrl,
      csv: [header, row('OTHER')].join('\n'),
    });
    await post(payload({ comment: 'while absent' })).expect(201);
    expect((await get().expect(200)).body.summary.count).toBe(2);
    await importCatalogue({
      databaseUrl,
      csv: [header, row(product.sku)].join('\n'),
    });
    expect((await get().expect(200)).body.summary.count).toBe(2);
  });
});
