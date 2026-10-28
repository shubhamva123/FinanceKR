import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services';
import type { DateProjection } from '@/types';
import { PageHeader, LoadingSpinner, ErrorState, StatCard } from '@/components/common';
import { formatINR, formatDate, classNames } from '@/utils/format';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  CreditCard,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
} from 'lucide-react';

export function DatePlannerPage() {
  const today = new Date().toISOString().split('T')[0];
  const defaultTarget = new Date();
  defaultTarget.setDate(defaultTarget.getDate() + 30);
  const defaultTargetStr = defaultTarget.toISOString().split('T')[0];

  const [targetDate, setTargetDate] = useState(defaultTargetStr);
  const [asOfDate, setAsOfDate] = useState(today);
  const [data, setData] = useState<DateProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getDatePlanner(targetDate)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [targetDate]);

  useEffect(() => { load(); }, [load]);

  const hasShortfall = data && data.shortfall > 0;

  return (
    <div>
      <PageHeader
        title="Date Planner"
        subtitle="Check your projected cash position on any future date"
      />

      {/* Date selector */}
      <div className="mb-6 card-padded">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">As of Date</label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="input pl-9"
              />
            </div>
            <p className="mt-1 text-xs text-ink-500">Starting point for projection</p>
          </div>
          <div>
            <label className="label">Target Date</label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input pl-9 border-primary-300"
              />
            </div>
            <p className="mt-1 text-xs text-primary-600">Check balance on this date</p>
          </div>
        </div>

        {/* Quick date presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: '7 days', days: 7 },
            { label: '15 days', days: 15 },
            { label: '30 days', days: 30 },
            { label: 'End of month', endOfMonth: true },
            { label: '60 days', days: 60 },
            { label: '90 days', days: 90 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                const d = new Date();
                if (preset.endOfMonth) {
                  d.setMonth(d.getMonth() + 1, 0);
                } else {
                  d.setDate(d.getDate() + (preset.days || 0));
                }
                setTargetDate(d.toISOString().split('T')[0]);
              }}
              className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculating projection…" />
      ) : error || !data ? (
        <ErrorState message="Could not load projection." onRetry={load} />
      ) : (
        <>
          {/* Projected position on target date */}
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={18} className="text-primary-600" />
              <h2 className="text-sm font-semibold text-ink-700">
                Projected Position on {formatDate(targetDate, 'long')}
              </h2>
            </div>

            {/* Main result — projected actual cash */}
            <div className={classNames(
              'mb-4 card-padded',
              hasShortfall ? 'bg-error-50 border-error-200' : 'bg-success-50 border-success-200',
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Projected Actual Cash
                  </p>
                  <p className={classNames(
                    'mt-1 text-3xl font-bold tabular-nums',
                    hasShortfall ? 'text-error-700' : 'text-success-700',
                  )}>
                    {formatINR(data.projectedActualCash)}
                  </p>
                </div>
                <div className={classNames(
                  'rounded-full p-3',
                  hasShortfall ? 'bg-error-100' : 'bg-success-100',
                )}>
                  {hasShortfall ? (
                    <AlertTriangle size={28} className="text-error-600" />
                  ) : (
                    <TrendingUp size={28} className="text-success-600" />
                  )}
                </div>
              </div>
              {hasShortfall && (
                <div className="mt-3 border-t border-error-200 pt-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-error-600" />
                    <p className="text-sm font-medium text-error-700">
                      Shortfall of {formatINR(data.shortfall)} expected on this date
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-error-600">
                    You may not have enough cash to cover all outgoing payments. Consider collecting dues early or arranging funds.
                  </p>
                </div>
              )}
            </div>

            {/* Cash breakdown */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Cash in Hand" value={formatINR(data.cashInHand)} tone="primary" sublabel="Physical cash" />
              <StatCard label="Cash in Bank" value={formatINR(data.cashInBank)} tone="primary" sublabel="All bank balances" />
              <StatCard label="Actual Cash" value={formatINR(data.actualCash)} tone="success" sublabel="Hand + Bank" />
              <StatCard label="Credit Available" value={formatINR(data.creditAvailable)} tone="accent" sublabel="NOT owned cash" />
            </div>

            {/* Credit card position — separated */}
            <div className="mb-4 card-padded bg-ink-50">
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

            {/* Receivable / Payable */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="card-padded border-success-200 bg-success-50">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle size={18} className="text-success-600" />
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Expected In (Receivable)</p>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-success-700">{formatINR(data.expectedIn)}</p>
                <p className="mt-0.5 text-xs text-success-600">Money you expect to receive by {formatDate(targetDate, 'long')}</p>
              </div>
              <div className="card-padded border-error-200 bg-error-50">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle size={18} className="text-error-600" />
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Expected Out (Payable)</p>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-error-700">{formatINR(data.expectedOut)}</p>
                <p className="mt-0.5 text-xs text-error-600">Money you need to pay by {formatDate(targetDate, 'long')}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="border-b border-ink-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-ink-700">Cash Flow Timeline</h2>
              <p className="text-xs text-ink-500">Chronological events from {formatDate(asOfDate, 'long')} to {formatDate(targetDate, 'long')}</p>
            </div>
            {data.timeline.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500">
                No scheduled events in this period.
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {data.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    <div className={classNames(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      event.incoming > 0 ? 'bg-success-100' : event.outgoing > 0 ? 'bg-error-100' : 'bg-ink-100',
                    )}>
                      {event.incoming > 0 ? (
                        <TrendingUp size={16} className="text-success-600" />
                      ) : event.outgoing > 0 ? (
                        <TrendingDown size={16} className="text-error-600" />
                      ) : (
                        <ChevronRight size={16} className="text-ink-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{event.event}</p>
                      <p className="text-xs text-ink-500">{formatDate(event.date, 'long')}</p>
                    </div>
                    <div className="text-right">
                      {event.incoming > 0 && (
                        <p className="text-sm font-semibold tabular-nums text-success-600">+{formatINR(event.incoming)}</p>
                      )}
                      {event.outgoing > 0 && (
                        <p className="text-sm font-semibold tabular-nums text-error-600">-{formatINR(event.outgoing)}</p>
                      )}
                      <p className="text-xs tabular-nums text-ink-500">Bal: {formatINR(event.projectedBalance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
