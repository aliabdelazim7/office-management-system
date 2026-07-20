import { Injectable } from '@nestjs/common';
import { Prisma, SequenceKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Allocates human-facing identifiers (CL-0001, INV-0042, …).
 *
 * The counter is a row that is incremented atomically. `COUNT(*) + 1` — the
 * obvious approach, and the one the previous implementation used — hands the
 * same number to two concurrent requests and then violates the unique index,
 * or worse, silently reuses an invoice number.
 */
@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(
    tenantId: string,
    kind: SequenceKind,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const db = tx ?? this.prisma.client;

    const sequence = await db.numberSequence.upsert({
      where: { tenantId_kind: { tenantId, kind } },
      create: { tenantId, kind, prefix: DEFAULT_PREFIX[kind], current: 1 },
      // The increment happens inside the database, so concurrent callers
      // serialise on the row rather than racing in application code.
      update: { current: { increment: 1 } },
      select: { prefix: true, current: true },
    });

    return `${sequence.prefix}${String(sequence.current).padStart(4, '0')}`;
  }
}

const DEFAULT_PREFIX: Record<SequenceKind, string> = {
  [SequenceKind.CLIENT_CODE]: 'CL-',
  [SequenceKind.INVOICE_NUMBER]: 'INV-',
  [SequenceKind.SERVICE_ORDER]: 'SO-',
  [SequenceKind.CONTRACT_NUMBER]: 'CT-',
  [SequenceKind.EXPENSE_VOUCHER]: 'EXP-',
};
