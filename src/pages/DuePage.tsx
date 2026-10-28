import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { DueItem, DueSummary, Account, RecordPaymentInput } from '@/types';
import { PageHeader, LoadingSpinner, ErrorState, EmptyState, Badge, Modal, StatCard } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { formatINR, formatDate, classNames } from '@/utils/format';
import {
  CalendarClock,
  HandCoins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownCircle,
} from 'lucide-react';

type Tab = 'TODAY' | 'UPCOMING' | 'OVERDUE' | 'ALL';

export function DuePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('TODAY');
  const [items, setItems] = useState<DueItem[]>([]);
  const [summary, setSummary] = useState<DueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collectItem, setCollectItem] = useState<DueItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getDue(tab)
      .then((res) => { setItems(res.items); setSummary(res.summary); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const tabs: { key: Tab; label: string; icon: typeof Clock }[] = [
    { key: 'TODAY', label: 'Today', icon: Clock },
    { key: 'UPCOMING', label: 'Upcoming', icon: CalendarClock },
    { key: 'OVERDUE', label: 'Overdue', icon: AlertTriangle },
    { key: 'ALL', label: 'All', icon: HandCoins },
  ];

  return (
    <div>
      <PageHeader title="Due" subtitle="Collections and dues" />

      {/* Summary cards */}
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Due" value={formatINR(summary.totalDue)} />
          <StatCard label="Collected" value={formatINR(summary.collected)} tone="success" />
          <StatCard label="Pending" value={formatINR(summary.pending)} tone="warning" />
          <StatCard label="Overdue" value={formatINR(summary.overdue)} tone="error" />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-md border border-ink-200 bg-white p-0.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={classNames(
                'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading dues…" />
        ) : error ? (
          <ErrorState message="Could not load dues." onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={tab === 'OVERDUE' ? 'No overdue dues' : 'No dues found'}
            message={tab === 'TODAY' ? 'Nothing due today. All caught up!' : tab === 'OVERDUE' ? 'No overdue payments. Great!' : 'No dues match the current filter.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Due Amount</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/ledger/${item.contractId}`)}
                          className="font-medium text-ink-900 hover:text-primary-600"
                        >
                          {item.personName}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-ink-500">{item.contractType.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{formatDate(item.dueDate, 'long')}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-900">{formatINR(item.dueAmount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-ink-900">{formatINR(item.remaining)}</td>
                      <td className="px-4 py-3"><Badge status={item.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setCollectItem(item)}
                          className="btn-primary btn-sm"
                        >
                          <ArrowDownCircle size={14} /> Collect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-ink-100 lg:hidden">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/ledger/${item.contractId}`)}
                      className="font-medium text-ink-900 hover:text-primary-600"
                    >
                      {item.personName}
                    </button>
                    <Badge status={item.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-500">
                    <span>{item.contractType.replace(/_/g, ' ')}</span>
                    <span>{formatDate(item.dueDate, 'long')}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold tabular-nums text-ink-900">{formatINR(item.remaining)}</span>
                    <button
                      onClick={() => setCollectItem(item)}
                      className="btn-primary btn-sm"
                    >
                      <ArrowDownCircle size={14} /> Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Collection Modal */}
      {collectItem && (
        <CollectionModal
          item={collectItem}
          onClose={() => setCollectItem(null)}
          onSuccess={() => {
            setCollectItem(null);
            toast('Payment recorded successfully', 'success');
            load();
          }}
        />
      )}
    </div>
  );
}

function CollectionModal({
  item,
  onClose,
  onSuccess,
}: {
  item: DueItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState(item.remaining);
  const [method, setMethod] = useState<'CASH' | 'BANK' | 'CARD' | 'UPI'>('CASH');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs);
      const cashAcc = accs.find((a) => a.type === 'CASH');
      if (cashAcc) setAccountId(cashAcc.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || amount <= 0) { setError('Amount must be greater than zero'); return; }
    if (!accountId) { setError('Please select an account'); return; }
    setSubmitting(true);
    try {
      const input: RecordPaymentInput = {
        contractId: item.contractId,
        scheduleEntryId: item.id,
        amount,
        method,
        accountId,
        date,
        reference: reference || undefined,
        notes: notes || undefined,
      };
      const result = await api.recordPayment(input);
      if (result.success) {
        onSuccess();
      } else {
        setError('Payment could not be recorded. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Collect Payment"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting ? 'Recording…' : 'Record Payment'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Read-only context */}
        <div className="rounded-md bg-ink-50 p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink-500">Person</p>
              <p className="font-medium text-ink-900">{item.personName}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Contract</p>
              <p className="font-medium text-ink-900">{item.contractType.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Due Amount</p>
              <p className="font-semibold tabular-nums text-ink-900">{formatINR(item.dueAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Remaining</p>
              <p className="font-semibold tabular-nums text-ink-900">{formatINR(item.remaining)}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Amount Received <span className="label-input">INPUT</span></label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="input tabular-nums"
            min={1}
            autoFocus
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="input">
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div>
            <label className="label">Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="label">Reference <span className="text-ink-400">(optional)</span></label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="input" placeholder="UTR / Cheque no." />
          </div>
        </div>

        <div>
          <label className="label">Notes <span className="text-ink-400">(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Any notes about this payment…" />
        </div>

        {error && (
          <div className="rounded-md bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>
        )}
      </form>
    </Modal>
  );
}
