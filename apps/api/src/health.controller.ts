import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}
  @Get()
  async readiness() {
    try {
      await this.database.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
