import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './database.service.js';
@Module({
  controllers: [HealthController, ProductsController],
  providers: [DatabaseService],
})
export class AppModule {}
