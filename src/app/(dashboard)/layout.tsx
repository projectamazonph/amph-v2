import { requireAuth } from '@/lib/auth';
import { NavSidebar, type NavItem } from '@/components/ui/NavSidebar';
import { TopBar } from '@/components/ui/TopBar';
import styles from './layout.module.css';

const STUDENT_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'House' },
  { href: '/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/tools', label: 'Tools', icon: 'Gear' },
  { href: '/live-classes', label: 'Live classes', icon: 'Video' },
  { href: '/certificates', label: 'Certificates', icon: 'GraduationCap' },
  { href: '/payments', label: 'Payments', icon: 'CreditCard' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAuth redirects to /auth/signin if not authenticated.
  const user = await requireAuth();

  return (
    <div className={styles.shell}>
      <NavSidebar
        items={STUDENT_NAV_ITEMS}
        homeHref="/dashboard"
        brandSuffix=""
        ariaLabel="Student navigation"
      />
      <div className={styles.main}>
        <TopBar user={user} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
