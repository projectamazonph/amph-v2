import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = 'default',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[variant], className)} {...rest}>
      {children}
    </span>
  );
}