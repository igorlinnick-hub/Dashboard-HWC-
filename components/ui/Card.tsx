'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-surface-border bg-surface-card p-5 transition-all duration-200 ${className}`}>
      {title && <h3 className="mb-3 text-base font-semibold text-text-primary">{title}</h3>}
      {children}
    </div>
  );
}
