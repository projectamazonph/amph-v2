import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    user: { findUnique: fn(), create: fn() },
    pricingTier: { findUnique: fn() },
    enrollment: { findMany: fn(), createMany: fn() },
    $transaction: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

const mockEnums = vi.hoisted(() => ({
  EnrollmentStatus: { ACTIVE: 'ACTIVE' },
}));
vi.mock('@/lib/enums', () => mockEnums);

// claim-token.ts calls these directly (not mocked itself) — mocking node:crypto
// gives deterministic raw tokens/hashes without stubbing claim-token.ts's logic.
vi.mock('node:crypto', () => ({
  randomUUID: () => 'mock-uuid',
  randomBytes: (n: number) => Buffer.alloc(n, 1),
  createHash: () => ({ update: () => ({ digest: () => 'mock-hash' }) }),
}));

import { findOrCreateUserByEmail, grantManualEnrollment } from '@/lib/enrollment';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: run the transaction callback against the same mock client.
  mockDb.$transaction.mockImplementation(
    async (cb: (tx: typeof mockDb) => Promise<unknown>) => cb(mockDb),
  );
});

describe('findOrCreateUserByEmail', () => {
  it('returns the existing user without creating', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' });

    const result = await findOrCreateUserByEmail('Existing@Email.com');

    expect(result).toEqual({ id: 'user-1', isNew: false });
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'existing@email.com' },
      select: { id: true },
    });
    expect(mockDb.user.create).not.toHaveBeenCalled();
  });

  it('creates a placeholder user with claim token when none exists', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue({ id: 'user-new' });

    const result = await findOrCreateUserByEmail('  New@Email.com ', 'Juan');

    expect(result.id).toBe('user-new');
    expect(result.isNew).toBe(true);
    expect(result.rawClaimToken).toBeTruthy();

    const createArg = mockDb.user.create.mock.calls[0]![0]!;
    expect(createArg.data.email).toBe('new@email.com');
    expect(createArg.data.name).toBe('Juan');
    expect(createArg.data.passwordHash).toMatch(/^placeholder_/);
    expect(createArg.data.claimTokenHash).toBeTruthy();
    expect(createArg.data.role).toBe('STUDENT');
  });

  it('defaults the name to the email local part', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue({ id: 'user-new' });

    await findOrCreateUserByEmail('maria@email.com');

    expect(mockDb.user.create.mock.calls[0]![0]!.data.name).toBe('maria');
  });
});

describe('grantManualEnrollment', () => {
  const tier = {
    id: 'tier-1',
    name: 'PPC Foundations',
    tier: 'FOUNDATIONS',
    isActive: true,
    deletedAt: null,
    courses: [{ id: 'course-1' }, { id: 'course-2' }],
  };

  it('throws when the tier is missing', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue(null);

    await expect(
      grantManualEnrollment({ email: 'a@b.com', pricingTierId: 'nope' }),
    ).rejects.toThrow(/not found or inactive/);
  });

  it('throws when the tier is inactive', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue({ ...tier, isActive: false });

    await expect(
      grantManualEnrollment({ email: 'a@b.com', pricingTierId: 'tier-1' }),
    ).rejects.toThrow(/not found or inactive/);
  });

  it('throws when the tier has no courses', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue({ ...tier, courses: [] });

    await expect(
      grantManualEnrollment({ email: 'a@b.com', pricingTierId: 'tier-1' }),
    ).rejects.toThrow(/no courses attached/);
  });

  it('enrolls a new user in all tier courses and returns the claim token', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue(tier);
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue({ id: 'user-new' });
    mockDb.enrollment.findMany.mockResolvedValue([]);
    mockDb.enrollment.createMany.mockResolvedValue({ count: 2 });

    const result = await grantManualEnrollment({
      email: 'student@email.com',
      name: 'Student',
      pricingTierId: 'tier-1',
    });

    expect(result.isNewUser).toBe(true);
    expect(result.rawClaimToken).toBeTruthy();
    expect(result.tierName).toBe('PPC Foundations');
    expect(result.enrolledCourseIds).toEqual(['course-1', 'course-2']);
    expect(result.alreadyEnrolledCourseIds).toEqual([]);

    const createManyArg = mockDb.enrollment.createMany.mock.calls[0]![0]!;
    expect(createManyArg.data).toHaveLength(2);
    expect(createManyArg.data[0]).toMatchObject({
      userId: 'user-new',
      courseId: 'course-1',
      pricingTierId: 'tier-1',
      tier: 'FOUNDATIONS',
      status: 'ACTIVE',
    });
  });

  it('skips courses the user is already enrolled in', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue(tier);
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockDb.enrollment.findMany.mockResolvedValue([{ courseId: 'course-1' }]);
    mockDb.enrollment.createMany.mockResolvedValue({ count: 1 });

    const result = await grantManualEnrollment({
      email: 'student@email.com',
      pricingTierId: 'tier-1',
    });

    expect(result.isNewUser).toBe(false);
    expect(result.rawClaimToken).toBeUndefined();
    expect(result.enrolledCourseIds).toEqual(['course-2']);
    expect(result.alreadyEnrolledCourseIds).toEqual(['course-1']);
    expect(mockDb.enrollment.createMany.mock.calls[0]![0]!.data).toHaveLength(1);
  });

  it('creates nothing when the user already has every course', async () => {
    mockDb.pricingTier.findUnique.mockResolvedValue(tier);
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockDb.enrollment.findMany.mockResolvedValue([
      { courseId: 'course-1' },
      { courseId: 'course-2' },
    ]);

    const result = await grantManualEnrollment({
      email: 'student@email.com',
      pricingTierId: 'tier-1',
    });

    expect(result.enrolledCourseIds).toEqual([]);
    expect(mockDb.enrollment.createMany).not.toHaveBeenCalled();
  });
});
