import { Menu, LogOut, Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="btn-icon lg:hidden">
          <Menu size={20} />
        </button>
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search people, contracts…"
            className="w-64 rounded-md border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-700 placeholder-ink-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-icon relative">
          <Bell size={20} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error-500" />
        </button>
        <div className="hidden items-center gap-2 border-l border-ink-200 pl-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-ink-900">{session?.userName}</p>
            <p className="text-xs text-ink-500">{session?.role === 'admin' ? 'Administrator' : 'Financer'}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {session?.userName?.charAt(0).toUpperCase() ?? '?'}
          </div>
        </div>
        <button onClick={handleLogout} className="btn-icon" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
