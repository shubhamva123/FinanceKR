import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Account } from '@/types';
import { PageHeader, LoadingSpinner } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { formatINR, classNames } from '@/utils/format';
import { Calendar } from 'lucide-react';

type Mode = 'MANUAL' | 'DIRECT' | 'DIRECT2';

export function MonthlyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('MANUAL');

  // Common fields
  const [personName, setPersonName] = useState('');
  const [contact, setContact] = useState('');
  const [amountGiven, setAmountGiven] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');

  // MANUAL fields
  const [monthlyInterest, setMonthlyInterest] = useState(0);
  const [period, setPeriod] = useState(0);
  const [plannedMonthlyPayment, setPlannedMonthlyPayment] = useState(0);
  const [dateRule, setDateRule] = useState<'AUTO' | 'FIXED' | 'MANUAL'>('AUTO');
  const [firstDueDate, setFirstDueDate] = useState('');

  // DIRECT fields
  const [numberOfMonths, setNumberOfMonths] = useState(0);
  const [interestCreditDate, setInterestCreditDate] = useState('');
  const [finalPrincipalDate, setFinalPrincipalDate] = useState('');

  // DIRECT2 fields
  const [totalAmountToReceive, setTotalAmountToReceive] = useState(0);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs);
      const cash = accs.find((a) => a.type === 'CASH');
      if (cash) setAccountId(cash.id);
      setLoadingAccounts(false);
    });
  }, []);

  const calculatedTotalRecovery = useMemo(() => {
    if (mode === 'MANUAL') return plannedMonthlyPayment * period;
    if (mode === 'DIRECT') return amountGiven + monthlyInterest * numberOfMonths;
    if (mode === 'DIRECT2') return totalAmountToReceive;
    return 0;
  }, [mode, plannedMonthlyPayment, period, amountGiven, monthlyInterest, numberOfMonths, totalAmountToReceive]);

  const calculatedProfit = useMemo(() => {
    if (mode === 'MANUAL') return calculatedTotalRecovery - amountGiven;
    if (mode === 'DIRECT') return monthlyInterest * numberOfMonths;
    if (mode === 'DIRECT2') return totalAmountToReceive - amountGiven;
    return 0;
  }, [mode, calculatedTotalRecovery, amountGiven, monthlyInterest, numberOfMonths, totalAmountToReceive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!personName.trim()) { setError('Person name is required'); return; }
    if (amountGiven <= 0) { setError('Amount given must be greater than zero'); return; }
    if (!accountId) { setError('Please select a fund source account'); return; }

    setSubmitting(true);
    try {
      const res = await api.createMonthly({
        mode, personName, contact, amountGiven,
        monthlyInterest, period, plannedMonthlyPayment,
        numberOfMonths, interestCreditDate, finalPrincipalDate,
        totalAmountToReceive, dueDate,
        startDate, dateRule, firstDueDate,
        fundSource: 'CASH', accountId, notes,
      });
      toast('Monthly contract created successfully', 'success');
      navigate(`/ledger/${res.contract.id}`);
    } catch {
      setError('Could not create contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAccounts) return <LoadingSpinner label="Loading…" />;

  return (
    <div>
      <PageHeader title="New Monthly Entry" subtitle="Manual / Direct / Direct 2 lending" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        {/* Mode selector */}
        <div className="flex gap-1 rounded-lg border border-ink-200 bg-white p-1">
          {(['MANUAL', 'DIRECT', 'DIRECT2'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={classNames(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                mode === m ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {m === 'MANUAL' ? 'Manual' : m === 'DIRECT' ? 'Direct' : 'Direct 2'}
            </button>
          ))}
        </div>

        {/* Person info */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Person Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Person Name <span className="label-input">INPUT</span></label>
              <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Contact <span className="text-ink-400">(optional)</span></label>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Mode-specific fields */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">
            {mode === 'MANUAL' && 'Manual Monthly Terms'}
            {mode === 'DIRECT' && 'Direct Monthly Terms'}
            {mode === 'DIRECT2' && 'Direct 2 Terms'}
          </h3>

          {/* Common: Amount Given */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Amount Given <span className="label-input">INPUT</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                <input type="number" value={amountGiven || ''} onChange={(e) => setAmountGiven(Number(e.target.value))} className="input pl-7 tabular-nums" required min={1} />
              </div>
            </div>

            {/* MANUAL */}
            {mode === 'MANUAL' && (
              <>
                <div>
                  <label className="label">Monthly Interest <span className="label-input">INPUT</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                    <input type="number" value={monthlyInterest || ''} onChange={(e) => setMonthlyInterest(Number(e.target.value))} className="input pl-7 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="label">Period (months) <span className="label-input">INPUT</span></label>
                  <input type="number" value={period || ''} onChange={(e) => setPeriod(Number(e.target.value))} className="input tabular-nums" min={1} />
                </div>
                <div>
                  <label className="label">Planned Monthly Payment <span className="label-input">INPUT</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                    <input type="number" value={plannedMonthlyPayment || ''} onChange={(e) => setPlannedMonthlyPayment(Number(e.target.value))} className="input pl-7 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="label">Date Method</label>
                  <select value={dateRule} onChange={(e) => setDateRule(e.target.value as typeof dateRule)} className="input">
                    <option value="AUTO">AUTO</option>
                    <option value="FIXED">FIXED</option>
                    <option value="MANUAL">MANUAL</option>
                  </select>
                </div>
                <div>
                  <label className="label">First Due Date</label>
                  <input type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className="input" />
                </div>
              </>
            )}

            {/* DIRECT */}
            {mode === 'DIRECT' && (
              <>
                <div>
                  <label className="label">Monthly Interest <span className="label-input">INPUT</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                    <input type="number" value={monthlyInterest || ''} onChange={(e) => setMonthlyInterest(Number(e.target.value))} className="input pl-7 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="label">Number of Months <span className="label-input">INPUT</span></label>
                  <input type="number" value={numberOfMonths || ''} onChange={(e) => setNumberOfMonths(Number(e.target.value))} className="input tabular-nums" min={1} />
                </div>
                <div>
                  <label className="label">Interest Credit Date</label>
                  <input type="date" value={interestCreditDate} onChange={(e) => setInterestCreditDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Final Principal Date</label>
                  <input type="date" value={finalPrincipalDate} onChange={(e) => setFinalPrincipalDate(e.target.value)} className="input" />
                </div>
              </>
            )}

            {/* DIRECT2 */}
            {mode === 'DIRECT2' && (
              <>
                <div>
                  <label className="label">Total Amount to Receive <span className="label-input">INPUT</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                    <input type="number" value={totalAmountToReceive || ''} onChange={(e) => setTotalAmountToReceive(Number(e.target.value))} className="input pl-7 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
                </div>
              </>
            )}

            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 space-y-2 rounded-md bg-accent-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-accent-700">Total Expected Recovery <span className="label-calculated">CALCULATED</span></span>
              <span className="text-lg font-bold tabular-nums text-accent-800">{formatINR(calculatedTotalRecovery)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-accent-200 pt-2">
              <span className="text-sm font-medium text-accent-700">Profit / Interest <span className="label-calculated">CALCULATED</span></span>
              <span className="text-lg font-bold tabular-nums text-accent-800">{formatINR(calculatedProfit)}</span>
            </div>
            {mode === 'DIRECT' && (
              <div className="border-t border-accent-200 pt-2">
                <p className="text-xs text-accent-600">Interest collected periodically. Principal due at end on {finalPrincipalDate || '—'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Funding */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Funding & Notes</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Fund Source</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
                <option value="">Select account…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes <span className="text-ink-400">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
          </div>
        </div>

        {error && <div className="rounded-md bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            <Calendar size={16} /> {submitting ? 'Creating…' : 'Create Monthly Contract'}
          </button>
        </div>
      </form>
    </div>
  );
}
