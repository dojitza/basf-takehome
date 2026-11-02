import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readConfig } from './config.js';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: readConfig().databaseUrl,
        connectionTimeoutMillis: 2000,
        query_timeout: 2000,
      }),
    });
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
