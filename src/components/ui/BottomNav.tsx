'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import type { BottomNavSlot, BottomNavProps } from './BottomNav.types';
import styles from './BottomNav.module.css';

const SLOTS: Array<{ key: BottomNavSlot; label: string; href: string; icon: string }> = [
  { key: 'home',    label: 'Home',    href: '/dashboard',          icon: 'House' },
  { key: 'courses', label: 'Courses', href: '/dashboard/courses',  icon: 'BookOpen' },
  { key: 'tools',   label: 'Tools',   href: '/dashboard/tools',    icon: 'Gear' },
  { key: 'profile', label: 'Profile', href: '/dashboard/payments', icon: 'User' },
];

export function BottomNav({ active, hrefOverrides = {} }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav} aria-label="Primary">
      {SLOTS.map(({ key, label, href, icon }) => (
        <Link
          key={key}
          href={hrefOverrides[key] ?? href}
          className={clsx(styles.slot, active === key && styles.active)}
          aria-current={active === key ? 'page' : undefined}
        >
          <Icon name={icon as never} size="lg" weight="light" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
