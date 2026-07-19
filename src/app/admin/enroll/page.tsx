import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatPhp } from '@/lib/format';
import { EnrollForm } from './EnrollForm';
import styles from './enroll.module.css';

export const metadata = { title: 'Enroll a Student — Admin' };

export default async function AdminEnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const tiers = await db.pricingTier.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      pricePhp: true,
      courses: { where: { deletedAt: null }, select: { id: true } },
    },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Enroll a Student</h1>
        <p className={styles.subtitle}>
          Payments are handled outside the platform (GCash / bank transfer).
          Once a student has paid, enroll them here. New students get a
          one-time claim link — send it to them yourself via Messenger or
          email so they can set their password.
        </p>
      </header>

      <EnrollForm
        defaultEmail={sp.email ?? ''}
        tiers={tiers.map((t: (typeof tiers)[number]) => ({
          id: t.id,
          name: t.name,
          priceLabel: formatPhp(t.pricePhp),
          courseCount: t.courses.length,
        }))}
      />
    </div>
  );
}
