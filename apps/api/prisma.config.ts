import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
config({ path: '../../.env', quiet: true });
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://product_finder:product_finder@localhost:5432/product_finder',
  },
});
