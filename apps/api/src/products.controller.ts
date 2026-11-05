import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { DatabaseService } from './database.service.js';
import { UUID_PATTERN, parsePaginationInt } from './validation.js';

const statuses = ['ACTIVE', 'PHASE_OUT', 'DISCONTINUED', 'UNAVAILABLE'];

const array = (value: unknown): string[] => {
  if (value === undefined) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    return value as string[];
  throw new BadRequestException('Invalid filter');
};

@Controller('products')
export class ProductsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    const limit = parsePaginationInt(query['limit'], 30, 1, 100);
    const offset = parsePaginationInt(query['offset'], 0, 0, 1000000);
    const selected = array(query['status']);
    const areas = array(query['applicationArea']);
    if (
      selected.some((status) => !statuses.includes(status)) ||
      areas.some((area) => !area.trim())
    )
      throw new BadRequestException('Invalid filter');
    const sort = query['sort'] ?? 'name';
    if (sort !== 'name' && sort !== 'name-desc')
      throw new BadRequestException('Invalid sort');
    if (
      query['search'] !== undefined &&
      (typeof query['search'] !== 'string' || query['search'].length > 200)
    )
      throw new BadRequestException('Invalid search');
    const search = (query['search'] as string | undefined)?.trim();
    // Escape LIKE metacharacters so search input is matched literally.
    const literal = search?.replace(/[\\%_]/g, '\\$&');
    const table = Prisma.raw(
      `"${(this.db.schema ?? 'public').replace(/"/g, '""')}"."Product"`,
    );
    const whereSql = Prisma.sql`
      ${
        selected.length
          ? Prisma.sql`(${Prisma.join(
              selected.map((status) =>
                status === 'UNAVAILABLE'
                  ? Prisma.sql`(NOT "presentInLatestImport" OR ("presentInLatestImport" AND status = 'UNKNOWN'))`
                  : Prisma.sql`("presentInLatestImport" AND status::text = ${status})`,
              ),
              ' OR ',
            )})`
          : Prisma.sql`"presentInLatestImport"`
      }
      ${literal ? Prisma.sql`AND (name ILIKE ${`%${literal}%`} OR sku ILIKE ${`%${literal}%`})` : Prisma.empty}
      ${areas.length ? Prisma.sql`AND "applicationArea" IN (${Prisma.join(areas)})` : Prisma.empty}
    `;

    const [items, countRows, areaRows] = await Promise.all([
      this.db.$queryRaw<
        {
          id: string;
          sku: string;
          name: string | null;
          status: ProductStatus;
          presentInLatestImport: boolean;
          applicationArea: string | null;
          chemicalName: string | null;
          function: string | null;
        }[]
      >(Prisma.sql`
        SELECT id, sku, name, status, "presentInLatestImport", "applicationArea", "chemicalName", function
        FROM ${table}
        WHERE ${whereSql}
        ORDER BY lower(name) ${sort === 'name' ? Prisma.sql`ASC` : Prisma.sql`DESC`} NULLS LAST, sku ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.db.$queryRaw<{ total: number }[]>(Prisma.sql`
        SELECT count(*)::int AS total
        FROM ${table}
        WHERE ${whereSql}
      `),
      this.db.product.findMany({
        where: { applicationArea: { not: null } },
        distinct: ['applicationArea'],
        select: { applicationArea: true },
        orderBy: { applicationArea: 'asc' },
      }),
    ]);
    const total = countRows[0]?.total ?? 0;
    return {
      items,
      total,
      nextOffset: offset + items.length < total ? offset + items.length : null,
      applicationAreas: areaRows
        .map((row) => row.applicationArea)
        .filter(Boolean),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    if (!UUID_PATTERN.test(id)) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.db.product.findUnique({
      where: { id: id.toLowerCase() },
      select: {
        id: true,
        sku: true,
        name: true,
        chemicalName: true,
        function: true,
        applicationArea: true,
        region: true,
        certifications: true,
        status: true,
        launchYear: true,
        description: true,
        presentInLatestImport: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
