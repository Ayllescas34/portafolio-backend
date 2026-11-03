import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExperiencesService } from './experiences.service';

describe('ExperiencesService period rules', () => {
  const current = {
    id: 'e',
    startDate: new Date('2025-02-01T00:00:00Z'),
    endDate: new Date('2026-01-01T00:00:00Z'),
    isCurrent: false,
  };
  let prisma: { experience: { findUnique: jest.Mock }; $transaction: jest.Mock };
  let service: ExperiencesService;

  beforeEach(() => {
    prisma = {
      experience: { findUnique: jest.fn().mockResolvedValue(current) },
      $transaction: jest.fn(),
    };
    service = new ExperiencesService(prisma as unknown as PrismaService);
  });

  const base = { company: 'Empresa', position: 'Puesto', startDate: '2026-02-01' };

  it('rejects a current job with an end date', async () => {
    await expect(service.create({ ...base, isCurrent: true, endDate: '2026-03-01' })).rejects.toThrow(
      'Una experiencia actual no puede tener fecha de finalización',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires an end date for past jobs', async () => {
    await expect(service.create({ ...base, isCurrent: false })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects end dates before the start date', async () => {
    await expect(service.create({ ...base, endDate: '2025-01-01' })).rejects.toThrow(/anterior a la inicial/);
  });

  it('validates partial updates against the stored values', async () => {
    await expect(service.update('e', { endDate: '2024-01-01' })).rejects.toThrow(/anterior a la inicial/);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
