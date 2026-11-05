import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from './database.service.js';
import { UUID_PATTERN, parsePaginationInt } from './validation.js';

const select = {
  id: true,
  rating: true,
  reviewerName: true,
  comment: true,
  createdAt: true,
} as const;

function optionalText(value: unknown, max: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || value.trim().length > max)
    throw new BadRequestException('Invalid review');
  return value.trim() || null;
}

@Controller('products/:id/reviews')
export class ReviewsController {
  constructor(private readonly db: DatabaseService) {}

  private async product(id: string) {
    if (
      !UUID_PATTERN.test(id) ||
      !(await this.db.product.findUnique({
        where: { id: id.toLowerCase() },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Product not found');
    return id.toLowerCase();
  }

  @Get()
  async list(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    const productId = await this.product(id);
    const limit = parsePaginationInt(query['limit'], 10, 1, 100);
    let cursor: { createdAt: Date; id: string } | undefined;
    if (query['cursor'] !== undefined) {
      try {
        if (
          typeof query['cursor'] !== 'string' ||
          !/^[A-Za-z0-9_-]+$/.test(query['cursor'])
        )
          throw new Error();
        const parsed: unknown = JSON.parse(
          Buffer.from(query['cursor'], 'base64url').toString(),
        );
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !('createdAt' in parsed) ||
          !('id' in parsed) ||
          typeof parsed.createdAt !== 'string' ||
          typeof parsed.id !== 'string' ||
          !UUID_PATTERN.test(parsed.id)
        )
          throw new Error();
        const date = new Date(parsed.createdAt);
        if (
          Number.isNaN(date.valueOf()) ||
          date.toISOString() !== parsed.createdAt
        )
          throw new Error();
        cursor = { createdAt: date, id: parsed.id.toLowerCase() };
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }
    const [rows, aggregate] = await Promise.all([
      this.db.review.findMany({
        where: {
          productId,
          ...(cursor
            ? {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        select,
      }),
      this.db.review.aggregate({
        where: { productId },
        _count: { _all: true },
        _avg: { rating: true },
      }),
    ]);
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > limit && last
          ? Buffer.from(
              JSON.stringify({
                createdAt: last.createdAt.toISOString(),
                id: last.id,
              }),
            ).toString('base64url')
          : null,
      summary: { count: aggregate._count._all, average: aggregate._avg.rating },
    };
  }

  @Post()
  async create(@Param('id') id: string, @Body() body: unknown) {
    const productId = await this.product(id);
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('Invalid review');
    const data = body as Record<string, unknown>;
    if (
      Object.keys(data).some(
        (key) =>
          !['submissionId', 'rating', 'reviewerName', 'comment'].includes(key),
      ) ||
      typeof data['submissionId'] !== 'string' ||
      !UUID_PATTERN.test(data['submissionId']) ||
      typeof data['rating'] !== 'number' ||
      !Number.isInteger(data['rating']) ||
      data['rating'] < 1 ||
      data['rating'] > 5
    )
      throw new BadRequestException('Invalid review');
    const submissionId = data['submissionId'].toLowerCase();
    const rating = data['rating'];
    const reviewerName = optionalText(data['reviewerName'], 100);
    const comment = optionalText(data['comment'], 1000);
    try {
      return await this.db.review.create({
        data: { productId, submissionId, rating, reviewerName, comment },
        select,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.db.review.findUnique({
        where: { submissionId },
      });
      if (
        !existing ||
        existing.productId !== productId ||
        existing.rating !== rating ||
        existing.reviewerName !== reviewerName ||
        existing.comment !== comment
      )
        throw new ConflictException('Submission ID already used');
      const { id: reviewId, createdAt } = existing;
      return { id: reviewId, rating, reviewerName, comment, createdAt };
    }
  }
}
