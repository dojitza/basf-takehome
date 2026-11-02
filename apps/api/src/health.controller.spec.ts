import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './database.service.js';
describe('readiness', () => {
  it('does not expose database failure details', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: {
            $queryRaw: jest
              .fn<() => Promise<never>>()
              .mockRejectedValue(new Error('private connection details')),
          },
        },
      ],
    }).compile();
    await expect(module.get(HealthController).readiness()).rejects.toEqual(
      new ServiceUnavailableException('Database unavailable'),
    );
    await module.close();
  });
});
