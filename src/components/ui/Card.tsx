import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'default',
    padding = 'md',
    as: Tag = 'div',
    className,
    children,
    ...rest
  },
  ref
) {
  const Component = Tag as 'div';
  return (
    <Component
      ref={ref}
      className={clsx(
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export function CardHeader({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(styles.header, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx(styles.title, className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx(styles.description, className)} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(styles.content, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(styles.footer, className)} {...rest}>
      {children}
    </div>
  );
}