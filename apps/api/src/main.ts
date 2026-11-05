import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';
import { readConfig } from './config.js';
async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  if (process.env['SERVE_WEB'] === 'true') {
    const webRoot = join(process.cwd(), 'apps/web/dist/web/browser');
    app.useStaticAssets(webRoot, { index: false });
    await app.init();
    app
      .getHttpAdapter()
      .getInstance()
      .use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
        return res.sendFile(join(webRoot, 'index.html'));
      });
  }
  await app.listen(config.port, '0.0.0.0');
}
void bootstrap();
