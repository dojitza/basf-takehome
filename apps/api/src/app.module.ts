import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller.js';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './database.service.js';
import { ReviewsController } from './reviews.controller.js';
import { PublicConfigController } from './public-config.controller.js';
@Module({
  controllers: [
    HealthController,
    ProductsController,
    ReviewsController,
    PublicConfigController,
  ],
  providers: [DatabaseService],
})
export class AppModule {}
