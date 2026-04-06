'use client';

import { ReactNode } from 'react';
import { Header } from './Header';

interface PageWrapperProps {
  title: string;
  children: ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="flex-1">
      <Header title={title} />
      <main className="p-6">{children}</main>
    </div>
  );
}
