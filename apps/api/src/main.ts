import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { readConfig } from './config.js';
async function bootstrap() {
  const config = readConfig();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(config.port, '0.0.0.0');
}
void bootstrap();
