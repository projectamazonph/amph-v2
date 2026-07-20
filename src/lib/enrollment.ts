/**
 * Manual enrollment — stripped launch build.
 *
 * The PayMongo webhook pipeline was removed for launch; an admin grants
 * enrollments from /admin/enroll instead. Students who don't have an account
 * yet get a placeholder user with a single-use claim token — the admin hands
 * the claim link to the student directly (no email sending in this build),
 * and the student sets a password via /auth/signup?claim=... exactly like the
 * old guest-checkout flow.
 */

import 'server-only';

import { db } from './db';
import { EnrollmentStatus } from './enums';
import { generateClaimToken, PLACEHOLDER_PASSWORD_PREFIX } from './claim-token';
import { randomUUID } from 'node:crypto';

/**
 * Either the global (extended) client or a transaction scope. Both arms are
 * derived from `db`'s own type rather than the ambient `PrismaClient` /
 * `Prisma.TransactionClient` types — a `$extends()`-ed client is a
 * structurally distinct type from the un-extended ones, including the
 * transaction-scoped client its own `$transaction` callback provides.
 */
type DbClient = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Find a user by (canonicalized) email, or create a placeholder account. The
 * student claims it via /auth/signup by presenting the raw token; only the
 * token's hash is stored.
 *
 * Returns the raw claim token so the caller can hand it to the student. The
 * raw token is a one-time secret — show it to the admin once, never log it.
 */
export async function findOrCreateUserByEmail(
  email: string,
  name?: string | null,
  client: DbClient = db,
): Promise<{ id: string; isNew: boolean; rawClaimToken?: string }> {
  const canonicalEmail = email.trim().toLowerCase();
  const existing = await client.user.findUnique({
    where: { email: canonicalEmail },
    select: { id: true },
  });
  if (existing) return { id: existing.id, isNew: false };

  // `placeholder_` marks the account as unclaimed (see
  // PLACEHOLDER_PASSWORD_PREFIX) — it can never match a bcrypt hash, so the
  // account is unusable until claimed.
  const claim = generateClaimToken();
  const placeholder = await client.user.create({
    data: {
      email: canonicalEmail,
      name: name ?? canonicalEmail.split('@')[0],
      emailVerified: null,
      passwordHash: `${PLACEHOLDER_PASSWORD_PREFIX}${randomUUID()}`,
      claimTokenHash: claim.hash,
      claimTokenExpiresAt: claim.expiresAt,
      role: 'STUDENT',
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  return { id: placeholder.id, isNew: true, rawClaimToken: claim.raw };
}

export interface ManualEnrollmentInput {
  email: string;
  name?: string | null;
  pricingTierId: string;
}

export interface ManualEnrollmentResult {
  userId: string;
  isNewUser: boolean;
  /** Present only when a placeholder account was just created. */
  rawClaimToken?: string;
  tierName: string;
  enrolledCourseIds: string[];
  alreadyEnrolledCourseIds: string[];
}

/**
 * Grant a student access to every course attached to a pricing tier.
 *
 * Idempotent per course: existing enrollments (any status) are left untouched
 * and reported back in `alreadyEnrolledCourseIds`. User creation and
 * enrollment creation happen in one transaction so a failure can't leave a
 * claimable account with no access.
 */
export async function grantManualEnrollment({
  email,
  name,
  pricingTierId,
}: ManualEnrollmentInput): Promise<ManualEnrollmentResult> {
  const tier = await db.pricingTier.findUnique({
    where: { id: pricingTierId },
    select: {
      id: true,
      name: true,
      tier: true,
      isActive: true,
      deletedAt: true,
      courses: { where: { deletedAt: null }, select: { id: true } },
    },
  });
  if (!tier || !tier.isActive || tier.deletedAt) {
    throw new Error('Pricing tier not found or inactive.');
  }
  if (tier.courses.length === 0) {
    throw new Error('This tier has no courses attached — check the seed data.');
  }
  const courseIds = tier.courses.map((c: { id: string }) => c.id);

  return db.$transaction(async (tx) => {
    const user = await findOrCreateUserByEmail(email, name, tx);

    const existing = await tx.enrollment.findMany({
      where: { userId: user.id, courseId: { in: courseIds } },
      select: { courseId: true },
    });
    const alreadyEnrolled = new Set(
      existing.map((e: { courseId: string }) => e.courseId),
    );
    const toCreate = courseIds.filter((id: string) => !alreadyEnrolled.has(id));

    if (toCreate.length > 0) {
      await tx.enrollment.createMany({
        data: toCreate.map((courseId: string) => ({
          userId: user.id,
          courseId,
          pricingTierId: tier.id,
          tier: tier.tier,
          status: EnrollmentStatus.ACTIVE,
        })),
      });
    }

    return {
      userId: user.id,
      isNewUser: user.isNew,
      rawClaimToken: user.rawClaimToken,
      tierName: tier.name,
      enrolledCourseIds: toCreate,
      alreadyEnrolledCourseIds: [...alreadyEnrolled],
    };
  });
}
