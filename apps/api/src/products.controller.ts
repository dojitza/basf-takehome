import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { DatabaseService } from './database.service.js';

const statuses = ['ACTIVE', 'PHASE_OUT', 'DISCONTINUED', 'UNAVAILABLE'];
const array = (value: unknown): string[] => {
  if (value === undefined) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    return value as string[];
  throw new BadRequestException('Invalid filter');
};
const integer = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value))
    throw new BadRequestException('Invalid pagination');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max)
    throw new BadRequestException('Invalid pagination');
  return parsed;
};
@Controller('products')
export class ProductsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    const limit = integer(query['limit'], 30, 1, 100);
    const offset = integer(query['offset'], 0, 0, 1000000);
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
    if (query['search'] !== undefined && typeof query['search'] !== 'string')
      throw new BadRequestException('Invalid search');
    const search = (query['search'] as string | undefined)?.trim();
    const visibility: Prisma.ProductWhereInput = selected.length
      ? {
          OR: selected.map((status) =>
            status === 'UNAVAILABLE'
              ? {
                  OR: [
                    { presentInLatestImport: false },
                    { presentInLatestImport: true, status: 'UNKNOWN' },
                  ],
                }
              : {
                  presentInLatestImport: true,
                  status: status as ProductStatus,
                },
          ),
        }
      : { presentInLatestImport: true };
    // Prisma's contains translates to LIKE; escape metacharacters so input is literal.
    const literal = search?.replace(/[\\%_]/g, '\\$&');
    const where: Prisma.ProductWhereInput = {
      AND: [
        visibility,
        ...(literal
          ? [
              {
                OR: [
                  { name: { contains: literal, mode: 'insensitive' as const } },
                  { sku: { contains: literal, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
        ...(areas.length ? [{ applicationArea: { in: areas } }] : []),
      ],
    };
    const [items, total, areaRows] = await Promise.all([
      this.db.product.findMany({
        where,
        orderBy: [
          { name: { sort: sort === 'name' ? 'asc' : 'desc', nulls: 'last' } },
          { sku: 'asc' },
        ],
        skip: offset,
        take: limit,
        select: {
          sku: true,
          name: true,
          status: true,
          presentInLatestImport: true,
          applicationArea: true,
          chemicalName: true,
          function: true,
        },
      }),
      this.db.product.count({ where }),
      this.db.product.findMany({
        where: { applicationArea: { not: null } },
        distinct: ['applicationArea'],
        select: { applicationArea: true },
        orderBy: { applicationArea: 'asc' },
      }),
    ]);
    return {
      items,
      total,
      nextOffset: offset + items.length < total ? offset + items.length : null,
      applicationAreas: areaRows
        .map((row) => row.applicationArea)
        .filter(Boolean),
    };
  }
}
