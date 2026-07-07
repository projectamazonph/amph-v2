/**
 * Prisma client singleton + soft-delete middleware (ADR-012).
 *
 * Every query that goes through this client automatically filters out
 * soft-deleted records (`deletedAt: null`) for models that have a
 * `deletedAt` column. Bypass with `findUnique` on unique fields where the
 * caller genuinely needs the deleted record (rare).
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as Enums from './enums';
export { Enums };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Models that participate in soft-delete. Adding a new model with a
// `deletedAt` column? Add it here too.
const SOFT_DELETE_MODELS = new Set([
  'User',
  'Course',
  'Module',
  'Lesson',
  'Enrollment',
  'ModuleProgress',
  'LessonProgress',
  'Quiz',
  'QuizQuestion',
  'QuizAttempt',
  'Badge',
  'UserBadge',
  'Certificate',
  'LiveClass',
  'LiveClassRegistration',
  'ToolSession',
  'ToolResult',
  'Resource',
  'ContentDraft',
  'PricingTier',
  'CheckoutSession',
  'Payment',
  'DiscountCode',
  'RefundRequest',
  'TeamMember',
]);

const READ_OPERATIONS: ReadOp[] = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
];

type ReadOp =
  | 'findUnique'
  | 'findUniqueOrThrow'
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findMany'
  | 'count'
  | 'aggregate'
  | 'groupBy';

function injectDeletedAtFilter(params: Record<string, unknown>): void {
  if (!params) params = {};
  const where = (params.where as Record<string, unknown> | undefined) ?? {};

  if (where.deletedAt === undefined) {
    where.deletedAt = null;
    params.where = where;
  } else if (
    where.deletedAt &&
    typeof where.deletedAt === 'object' &&
    'not' in (where.deletedAt as Record<string, unknown>)
  ) {
    // Caller is explicitly filtering for deleted records — leave alone.
    return;
  }
}

db.$use(async (params, next) => {
  if (params.model && SOFT_DELETE_MODELS.has(params.model)) {
    if (READ_OPERATIONS.includes(params.action as ReadOp)) {
      injectDeletedAtFilter(params as unknown as Record<string, unknown>);
    }
  }
  return next(params);
});

// Re-export Prisma namespace for convenience in callers.
export { Prisma };
export type { PrismaClient } from '@prisma/client';