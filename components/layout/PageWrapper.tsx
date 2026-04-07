'use client';

import { ReactNode } from 'react';
import { Header } from './Header';

interface PageWrapperProps {
  title: string;
  children: ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="flex-1 bg-surface">
      <Header title={title} />
      <main className="animate-fade-in p-6">{children}</main>
    </div>
  );
}
