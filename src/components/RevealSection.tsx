'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reveals once and stays revealed. Unobserving after the first match
 * (instead of toggling visibility on every crossing) keeps the section
 * from re-hiding if a user scrolls back up past it.
 */
export function RevealSection({ children, className }: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // Also reveal if the element is already above the viewport (e.g. a
        // hash link landed past it). Without this, content scrolled past
        // before ever intersecting would stay permanently invisible.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${className ?? ''}${visible ? ' is-visible' : ''}`}>
      {children}
    </section>
  );
}
