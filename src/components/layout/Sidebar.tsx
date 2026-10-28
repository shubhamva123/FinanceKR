import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FilePlus,
  CalendarClock,
  BookOpen,
  Wallet,
  ArrowRightLeft,
  CalendarDays,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { classNames } from '@/utils/format';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavItem[];
}

const navItems: (NavItem | NavGroup)[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'People', to: '/people', icon: Users },
  {
    label: 'New Entry',
    icon: FilePlus,
    children: [
      { label: 'LDD', to: '/new/ldd', icon: FilePlus },
      { label: 'Per Month', to: '/new/monthly', icon: FilePlus },
      { label: 'Third Party', to: '/new/third-party', icon: FilePlus },
    ],
  },
  { label: 'Due', to: '/due', icon: CalendarClock },
  { label: 'Ledger', to: '/ledger', icon: BookOpen },
  { label: 'Accounts', to: '/accounts', icon: Wallet },
  { label: 'Transactions', to: '/transactions', icon: ArrowRightLeft },
  { label: 'Date Planner', to: '/date-planner', icon: CalendarDays },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
];

const adminItems: NavItem[] = [
  { label: 'Admin Dashboard', to: '/admin', icon: ShieldCheck, end: true },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'children' in item;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin';
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['New Entry']));

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200 bg-ink-900 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo / brand */}
        <div className="flex h-16 items-center justify-between border-b border-ink-800 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Financer</p>
              <p className="text-2xs text-ink-400">Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon text-ink-400 lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-wider text-ink-500">Menu</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              if (isGroup(item)) {
                const expanded = expandedGroups.has(item.label);
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {expanded && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-ink-800 pl-3">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              onClick={onClose}
                              className={({ isActive }) =>
                                classNames(
                                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                                  isActive
                                    ? 'bg-primary-600 font-medium text-white'
                                    : 'text-ink-400 hover:bg-ink-800 hover:text-white',
                                )
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      classNames(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                      )
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {isAdmin && (
            <>
              <p className="mb-2 mt-6 px-3 text-2xs font-semibold uppercase tracking-wider text-ink-500">Admin</p>
              <ul className="space-y-0.5">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          classNames(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-accent-600 text-white'
                              : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                          )
                        }
                      >
                        <Icon size={18} />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-ink-800 p-3">
          <div className="rounded-md bg-ink-800 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">{session?.userName ?? 'Unknown'}</p>
            <p className="truncate text-xs text-ink-400">{session?.businessName ?? ''}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
