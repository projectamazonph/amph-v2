import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import styles from './page.module.css';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  // Quick stats — keep queries cheap
  const [userCount, courseCount, badgeCount] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.badge.count(),
  ]);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>Welcome, {admin.name ?? admin.email}</h1>
        <p className={styles.subtitle}>
          You&apos;re signed in as an admin. Sprint 1 ships the foundation — the rest fills in over the next 11 sprints.
        </p>
      </header>

      <section className={styles.stats}>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{userCount}</div>
            <Badge variant="default">Total accounts</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{courseCount}</div>
            <Badge variant="info">Published + drafts</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{badgeCount}</div>
            <Badge variant="success">Seeded</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>3</div>
            <Badge variant="warning">PPC Foundations / Mastery / Ultimate</Badge>
          </CardContent>
        </Card>
      </section>

      <section className={styles.next}>
        <Card>
          <CardHeader>
            <CardTitle>
              <span className={styles.nextTitle}>
                <Icon name="Rocket" size="md" />
                Next up
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Sprint 1 is the foundation. The interactive tools, curriculum, payments, and full admin
              panels come in Sprints 2-6. Today you can verify auth, see seeded data, and confirm
              that admin RBAC works.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}