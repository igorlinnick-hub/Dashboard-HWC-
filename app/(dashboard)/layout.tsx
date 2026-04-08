'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/hooks/use-toast';
import { SidebarProvider, useSidebar } from '@/hooks/use-sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <DashboardContent>
          {children}
        </DashboardContent>
      </SidebarProvider>
    </ToastProvider>
  );
}
