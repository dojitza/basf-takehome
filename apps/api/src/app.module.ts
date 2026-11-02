import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './database.service.js';
@Module({ controllers: [HealthController], providers: [DatabaseService] })
export class AppModule {}
