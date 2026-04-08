'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover hover:glow-orange-sm disabled:opacity-40 disabled:hover:shadow-none',
  secondary:
    'bg-surface-subtle text-text-primary hover:bg-surface-hover',
  outline:
    'border border-surface-border bg-transparent text-text-secondary hover:border-accent/50 hover:text-text-primary',
  ghost:
    'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
};

const sizes = {
  xs: 'px-2 py-1 text-[10px]',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
