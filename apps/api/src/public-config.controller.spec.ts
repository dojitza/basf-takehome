import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PublicConfigController } from './public-config.controller.js';

describe('public configuration', () => {
  let app: INestApplication;
  const previousKey = process.env['PRIMENG_LICENSE_KEY'];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PublicConfigController],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (previousKey === undefined) delete process.env['PRIMENG_LICENSE_KEY'];
    else process.env['PRIMENG_LICENSE_KEY'] = previousKey;
    await app.close();
  });

  it('returns the configured browser key without caching and handles a missing key', async () => {
    process.env['PRIMENG_LICENSE_KEY'] = 'example-key';
    await request(app.getHttpServer())
      .get('/public-config')
      .expect('Cache-Control', 'no-store')
      .expect(200, { primeNgLicenseKey: 'example-key' });
    delete process.env['PRIMENG_LICENSE_KEY'];
    await request(app.getHttpServer())
      .get('/public-config')
      .expect(200, { primeNgLicenseKey: '' });
  });
});
