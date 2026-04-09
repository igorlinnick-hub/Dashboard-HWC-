'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastData({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastData(null);
  }, []);

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type}
          onDone={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
