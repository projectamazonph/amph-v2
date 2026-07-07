'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    required,
    className,
    id,
    ...rest
  },
  ref
) {
  const inputId = id ?? `input-${rest.name ?? Math.random().toString(36).slice(2, 9)}`;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={clsx(styles.field, error && styles.fieldError)}>
        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={clsx(
            styles.input,
            leftIcon && styles.hasLeftIcon,
            rightIcon && styles.hasRightIcon,
            className
          )}
          {...rest}
        />
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});