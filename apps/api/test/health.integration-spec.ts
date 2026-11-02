import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
it('serves readiness through Nest and a real PostgreSQL connection', async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  try {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' });
  } finally {
    await app.close();
  }
});
