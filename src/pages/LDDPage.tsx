import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Account, Contract, ScheduleEntry } from '@/types';
import { PageHeader, LoadingSpinner, Modal } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { formatINR, formatDate } from '@/utils/format';
import { FilePlus, CheckCircle2, BookOpen, CalendarDays } from 'lucide-react';

export function LDDPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ contract: Contract; schedule: ScheduleEntry[] } | null>(null);

  const [personName, setPersonName] = useState('');
  const [contact, setContact] = useState('');
  const [totalRecovery, setTotalRecovery] = useState(0);
  const [dailyCollection, setDailyCollection] = useState(0);
  const [days, setDays] = useState(0);
  const [actualAmountGiven, setActualAmountGiven] = useState(0);
  const [fundSource, setFundSource] = useState<'CASH' | 'BANK' | 'CARD'>('CASH');
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRule, setDateRule] = useState<'AUTO' | 'FIXED' | 'MANUAL'>('AUTO');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs);
      const cash = accs.find((a) => a.type === 'CASH');
      if (cash) setAccountId(cash.id);
      setLoadingAccounts(false);
    });
  }, []);

  // Live calculation: dailyCollection × days = totalRecovery (auto-calc)
  const calculatedTotalRecovery = useMemo(() => dailyCollection * days, [dailyCollection, days]);
  const calculatedDeduction = useMemo(() => totalRecovery - actualAmountGiven, [totalRecovery, actualAmountGiven]);
  const endDate = useMemo(() => {
    if (!startDate || !days) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }, [startDate, days]);

  // Auto-fill totalRecovery from daily × days
  useEffect(() => {
    if (dailyCollection > 0 && days > 0) {
      setTotalRecovery(calculatedTotalRecovery);
    }
  }, [calculatedTotalRecovery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!personName.trim()) { setError('Person name is required'); return; }
    if (actualAmountGiven <= 0) { setError('Actual amount given must be greater than zero'); return; }
    if (dailyCollection <= 0) { setError('Daily collection must be greater than zero'); return; }
    if (days <= 0) { setError('Days must be greater than zero'); return; }
    if (!accountId) { setError('Please select a fund source account'); return; }

    setSubmitting(true);
    try {
      const res = await api.createLDD({
        personName, contact, totalRecovery, dailyCollection, days,
        actualAmountGiven, fundSource, accountId, startDate, dateRule, notes,
      });
      setResult(res);
      toast('LDD contract created successfully', 'success');
    } catch {
      setError('Could not create contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAccounts) return <LoadingSpinner label="Loading…" />;

  return (
    <div>
      <PageHeader title="New LDD Entry" subtitle="Daily Lending / LDD contract" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        {/* Person info */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Person Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Person Name <span className="label-input">INPUT</span></label>
              <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="input" placeholder="Full name" required />
            </div>
            <div>
              <label className="label">Contact <span className="text-ink-400">(optional)</span></label>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="input" placeholder="Phone number" />
            </div>
          </div>
        </div>

        {/* Contract terms */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Contract Terms</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Daily Collection <span className="label-input">INPUT</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                <input type="number" value={dailyCollection || ''} onChange={(e) => setDailyCollection(Number(e.target.value))} className="input pl-7 tabular-nums" placeholder="1,000" min={1} />
              </div>
            </div>
            <div>
              <label className="label">Days <span className="label-input">INPUT</span></label>
              <input type="number" value={days || ''} onChange={(e) => setDays(Number(e.target.value))} className="input tabular-nums" placeholder="50" min={1} />
            </div>
            <div>
              <label className="label">Total Recovery <span className="label-calculated">CALCULATED</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                <input type="number" value={totalRecovery || ''} onChange={(e) => setTotalRecovery(Number(e.target.value))} className="input pl-7 tabular-nums bg-accent-50" />
              </div>
              <p className="mt-1 text-xs text-ink-500">{formatINR(dailyCollection)} × {days} = {formatINR(calculatedTotalRecovery)}</p>
            </div>
            <div>
              <label className="label">Actual Amount Given <span className="label-input">INPUT</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                <input type="number" value={actualAmountGiven || ''} onChange={(e) => setActualAmountGiven(Number(e.target.value))} className="input pl-7 tabular-nums" placeholder="41,000" min={1} />
              </div>
            </div>
          </div>

          {/* Calculated deduction */}
          <div className="mt-4 rounded-md bg-accent-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-accent-700">Upfront Deduction <span className="label-calculated">CALCULATED</span></span>
              <span className="text-lg font-bold tabular-nums text-accent-800">{formatINR(calculatedDeduction)}</span>
            </div>
            <p className="mt-1 text-xs text-accent-600">{formatINR(totalRecovery)} − {formatINR(actualAmountGiven)} = {formatINR(calculatedDeduction)}</p>
          </div>
        </div>

        {/* Funding & Schedule */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Funding & Schedule</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Fund Source</label>
              <select value={accountId} onChange={(e) => {
                setAccountId(e.target.value);
                const acc = accounts.find(a => a.id === e.target.value);
                if (acc) setFundSource(acc.type === 'CARD' ? 'CARD' : acc.type === 'BANK' ? 'BANK' : 'CASH');
              }} className="input" required>
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Date Rule</label>
              <select value={dateRule} onChange={(e) => setDateRule(e.target.value as typeof dateRule)} className="input">
                <option value="AUTO">AUTO — Daily, no Sundays</option>
                <option value="FIXED">FIXED — Same day each period</option>
                <option value="MANUAL">MANUAL — Custom dates</option>
              </select>
            </div>
            <div>
              <label className="label">End Date <span className="label-auto">AUTO</span></label>
              <input type="text" value={endDate ? formatDate(endDate, 'long') : '—'} readOnly className="input bg-ink-50 text-ink-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes <span className="text-ink-400">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Any notes about this contract…" />
          </div>
        </div>

        {error && <div className="rounded-md bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create LDD Contract'}
          </button>
        </div>
      </form>

      {/* Success modal */}
      {result && (
        <Modal
          open
          onClose={() => navigate(`/ledger/${result.contract.id}`)}
          title="Contract Created"
          footer={
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">Dashboard</button>
              <button onClick={() => navigate(`/ledger/${result.contract.id}`)} className="btn-primary">
                <BookOpen size={14} /> View Ledger
              </button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="rounded-full bg-success-100 p-4">
              <CheckCircle2 size={32} className="text-success-600" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">LDD Contract Created</h3>
            <p className="text-sm text-ink-500">Contract ID: {result.contract.id}</p>
            <div className="mt-2 w-full rounded-md bg-ink-50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-500">Amount Given</p>
                  <p className="font-semibold tabular-nums text-ink-900">{formatINR(result.contract.actualAmountGiven)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Total Recovery</p>
                  <p className="font-semibold tabular-nums text-ink-900">{formatINR(result.contract.totalExpectedRecovery)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Daily Collection</p>
                  <p className="font-semibold tabular-nums text-ink-900">{formatINR((result.contract as { dailyCollection: number }).dailyCollection)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Deduction</p>
                  <p className="font-semibold tabular-nums text-ink-900">{formatINR((result.contract as { upfrontDeduction: number }).upfrontDeduction)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Schedule Entries</p>
                  <p className="font-semibold tabular-nums text-ink-900">{result.schedule.length} days</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Start Date</p>
                  <p className="font-semibold text-ink-900">{formatDate(result.contract.startDate, 'long')}</p>
                </div>
              </div>
            </div>
            <button onClick={() => navigate(`/ledger/${result.contract.id}`)} className="btn-secondary btn-sm mt-2">
              <CalendarDays size={14} /> View Schedule
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
