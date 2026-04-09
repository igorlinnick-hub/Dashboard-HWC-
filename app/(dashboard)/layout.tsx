'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/hooks/use-toast';
import { SidebarProvider, useSidebar } from '@/hooks/use-sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();

  // Auth is handled by middleware — no client-side check needed.
  // The middleware redirects unauthenticated users to /login before
  // this layout ever renders.

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
