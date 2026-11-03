import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readConfig } from './config.js';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  readonly schema: string;
  constructor() {
    const config = readConfig();
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 2000,
        query_timeout: 2000,
      }),
    });
    this.schema =
      new URL(config.databaseUrl).searchParams.get('schema') ?? 'public';
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
