import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Dashboard as DashboardData } from '@/types';
import { PageHeader, StatCard, LoadingSpinner, ErrorState } from '@/components/common';
import { formatINR, formatINRShort, formatRelativeDays, formatDate } from '@/utils/format';
import {
  Wallet,
  Landmark,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CalendarClock,
  Users,
  FileText,
  ArrowDownCircle,
  ArrowRightLeft,
  FilePlus,
  CheckCircle2,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getDashboard()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const load = () => { setLoading(true); setError(false); api.getDashboard().then((d) => { setData(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); };

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error || !data) return <ErrorState message="Could not load dashboard data." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={formatDate(new Date(), 'long')}
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/new/ldd')} className="btn-primary btn-sm">
              <FilePlus size={14} /> New LDD
            </button>
            <button onClick={() => navigate('/new/monthly')} className="btn-secondary btn-sm">
              <FilePlus size={14} /> New Monthly
            </button>
            <button onClick={() => navigate('/new/third-party')} className="btn-secondary btn-sm">
              <FilePlus size={14} /> New Third Party
            </button>
            <button onClick={() => navigate('/due')} className="btn-secondary btn-sm">
              <ArrowDownCircle size={14} /> Receive Payment
            </button>
            <button onClick={() => navigate('/transactions')} className="btn-secondary btn-sm">
              <ArrowRightLeft size={14} /> Add Transaction
            </button>
          </div>
        }
      />

      {/* Cash position — visually separated sections */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cash in Hand" value={formatINR(data.cashInHand)} tone="primary" sublabel="Physical cash" />
        <StatCard label="Cash in Bank" value={formatINR(data.cashInBank)} tone="primary" sublabel="All bank balances" />
        <StatCard label="Actual Cash" value={formatINR(data.actualCash)} tone="success" sublabel="Hand + Bank" />
        <StatCard label="Credit Available" value={formatINR(data.creditAvailable)} tone="accent" sublabel="NOT owned cash" />
      </div>

      {/* Credit card section — separated */}
      <div className="mb-6 card-padded bg-ink-50">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-ink-500" />
          <p className="text-sm font-semibold text-ink-700">Credit Card Position</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Credit Card Balance</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-error-600">{formatINR(data.creditCardBalance)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Credit Available</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-accent-600">{formatINR(data.creditAvailable)}</p>
          </div>
        </div>
      </div>

      {/* Outstanding & Due */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Outstanding" value={formatINR(data.totalOutstanding)} sublabel={`${data.activeContracts} active contracts`} />
        <StatCard label="Today's Due" value={formatINR(data.todayDue)} tone="warning" />
        <StatCard label="Collected Today" value={formatINR(data.collectedToday)} tone="success" />
        <StatCard label="Overdue" value={formatINR(data.overdue)} tone="error" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Expected In" value={formatINR(data.expectedIn)} tone="success" sublabel="Receivable" />
        <StatCard label="Expected Out" value={formatINR(data.expectedOut)} tone="error" sublabel="Payable" />
      </div>

      {/* Activity overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-padded flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2.5"><Users size={20} className="text-primary-600" /></div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-ink-900">{data.activePeople}</p>
            <p className="text-xs text-ink-500">Active People</p>
          </div>
        </div>
        <div className="card-padded flex items-center gap-3">
          <div className="rounded-lg bg-accent-50 p-2.5"><FileText size={20} className="text-accent-600" /></div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-ink-900">{data.activeContracts}</p>
            <p className="text-xs text-ink-500">Active Contracts</p>
          </div>
        </div>
        <div className="card-padded flex items-center gap-3">
          <div className="rounded-lg bg-warning-50 p-2.5"><CalendarClock size={20} className="text-warning-600" /></div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-ink-900">{data.upcomingDues.length}</p>
            <p className="text-xs text-ink-500">Upcoming Dues</p>
          </div>
        </div>
        <div className="card-padded flex items-center gap-3">
          <div className="rounded-lg bg-error-50 p-2.5"><AlertTriangle size={20} className="text-error-600" /></div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-ink-900">{data.overdueCustomers.length}</p>
            <p className="text-xs text-ink-500">Overdue Customers</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'New LDD', icon: FilePlus, to: '/new/ldd', tone: 'bg-primary-600' },
            { label: 'New Monthly', icon: FilePlus, to: '/new/monthly', tone: 'bg-primary-600' },
            { label: 'New Third Party', icon: FilePlus, to: '/new/third-party', tone: 'bg-primary-600' },
            { label: 'Receive Payment', icon: ArrowDownCircle, to: '/due', tone: 'bg-success-600' },
            { label: 'Add Transaction', icon: ArrowRightLeft, to: '/transactions', tone: 'bg-ink-700' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="card-padded flex flex-col items-center gap-2 transition-transform hover:scale-[1.02] hover:shadow-md"
              >
                <div className={`rounded-lg ${action.tone} p-2.5`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-ink-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overdue customers */}
      <div className="card">
        <div className="border-b border-ink-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-error-500" />
            <h2 className="text-sm font-semibold text-ink-700">Overdue Customers</h2>
          </div>
        </div>
        {data.overdueCustomers.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-ink-500">
            <CheckCircle2 size={18} className="text-success-500" /> No overdue customers. All clear!
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {data.overdueCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/people/${c.id}`)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-ink-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-error-100 text-sm font-bold text-error-700">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-500">Overdue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-error-600">{formatINR(c.overdueAmount)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
