import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, X } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, exitSupportMode } = useAuth();

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Support mode banner */}
        {session?.isSupportMode && (
          <div className="flex items-center justify-between bg-warning-500 px-4 py-2 text-sm font-medium text-white">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} />
              <span>SUPPORT MODE — Acting as {session.supportTargetName ?? session.businessName}</span>
            </div>
            <button
              onClick={exitSupportMode}
              className="flex items-center gap-1 rounded bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
            >
              <X size={14} /> Exit Support Mode
            </button>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
