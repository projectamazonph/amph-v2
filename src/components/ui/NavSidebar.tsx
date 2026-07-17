'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type PhosphorIconName } from '@/components/ui/Icon';
import { BRAND_NAME } from '@/lib/brand';
import styles from './NavSidebar.module.css';

export interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIconName;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'House' },
  { href: '/admin/users', label: 'Users', icon: 'User' },
  { href: '/admin/courses', label: 'Courses', icon: 'BookOpen' },
  { href: '/admin/refunds', label: 'Refunds', icon: 'Receipt' },
  { href: '/admin/tool-scenarios', label: 'Tool scenarios', icon: 'List' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'ChartLine' },
];

interface NavSidebarProps {
  items?: NavItem[];
  homeHref?: string;
  brandSuffix?: string;
  ariaLabel?: string;
}

export function NavSidebar({
  items = ADMIN_NAV_ITEMS,
  homeHref = '/admin',
  brandSuffix = ' Admin',
  ariaLabel = 'Admin navigation',
}: NavSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar} aria-label={ariaLabel}>
      <div className={styles.brand}>
        <Link href={homeHref} className={styles.brandLink}>
          <span className={styles.brandMark}>◆</span>
          <span className={styles.brandText}>{`${BRAND_NAME}${brandSuffix}`}</span>
        </Link>
      </div>

      <ul className={styles.list}>
        {items.map((item) => {
          const isActive =
            item.href === homeHref
              ? pathname === homeHref
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