'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type PhosphorIconName } from '@/components/ui/Icon';
import styles from './NavSidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'House' },
  { href: '/admin/users', label: 'Users', icon: 'User' },
  { href: '/admin/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/admin/badges', label: 'Badges', icon: 'Trophy' },
  { href: '/admin/live-classes', label: 'Live classes', icon: 'Calendar' },
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
  { href: '/admin/settings', label: 'Settings', icon: 'Gear' },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar} aria-label="Admin navigation">
      <div className={styles.brand}>
        <Link href="/admin" className={styles.brandLink}>
          <span className={styles.brandMark}>◆</span>
          <span className={styles.brandText}>AMPH Admin</span>
        </Link>
      </div>

      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon name={item.icon} size="md" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}