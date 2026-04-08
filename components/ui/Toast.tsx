'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onDone: () => void;
}

export function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const color = type === 'success' ? 'text-emerald-400' : 'text-red-400';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface-card px-4 py-3 shadow-2xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm text-text-primary">{message}</span>
    </div>
  );
}
