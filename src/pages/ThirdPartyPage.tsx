import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Account, ThirdPartyType, RecoveryMode } from '@/types';
import { PageHeader, LoadingSpinner } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { formatINR, classNames } from '@/utils/format';
import { FileText, ArrowRight, ArrowLeftRight } from 'lucide-react';

const typeLabels: Record<ThirdPartyType, string> = {
  LOAN_GIVEN: 'Loan Given',
  LOAN_TAKEN: 'Loan Taken',
  EMI: 'EMI',
  FAMILY_PERSONAL: 'Family / Personal',
  OTHER: 'Other',
};

const recoveryLabels: Record<RecoveryMode, string> = {
  NONE: 'None',
  ONE_TIME: 'One Time',
  MONTHLY: 'Monthly',
  EMI: 'EMI',
  MANUAL: 'Manual',
};

export function ThirdPartyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<ThirdPartyType>('LOAN_GIVEN');
  const [amount, setAmount] = useState(0);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>('MONTHLY');
  const [duration, setDuration] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api.getAccounts().then((accs) => {
      setAccounts(accs);
      const cash = accs.find((a) => a.type === 'CASH');
      if (cash) setAccountId(cash.id);
      setLoadingAccounts(false);
    });
  }, []);

  const isMoneyOut = type === 'LOAN_GIVEN' || type === 'FAMILY_PERSONAL' || type === 'EMI';
  const noRecovery = recoveryMode === 'NONE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!personName.trim()) { setError('Person or purpose is required'); return; }
    if (amount <= 0) { setError('Amount must be greater than zero'); return; }
    if (!accountId) { setError('Please select a fund source account'); return; }

    setSubmitting(true);
    try {
      const res = await api.createThirdParty({
        personName, type, amount, recoveryMode,
        duration: duration || undefined,
        startDate, dueDate: dueDate || undefined,
        monthlyAmount: noRecovery ? undefined : monthlyAmount || undefined,
        fundSource: 'CASH', accountId, notes,
      });
      toast('Third party record created successfully', 'success');
      navigate(`/ledger/${res.contract.id}`);
    } catch {
      setError('Could not create record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAccounts) return <LoadingSpinner label="Loading…" />;

  return (
    <div>
      <PageHeader title="New Third Party Entry" subtitle="Loans, EMIs, family/personal records" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
        {/* Type selector */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Type</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(typeLabels) as ThirdPartyType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={classNames(
                  'rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                  type === t
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Person & Amount */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Person / Purpose <span className="label-input">INPUT</span></label>
              <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Amount <span className="label-input">INPUT</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} className="input pl-7 tabular-nums" required min={1} />
              </div>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Fund Source</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input" required>
                <option value="">Select account…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Money direction indicator */}
          <div className={classNames(
            'mt-4 flex items-center gap-2 rounded-md px-4 py-3',
            isMoneyOut ? 'bg-error-50' : 'bg-success-50',
          )}>
            {isMoneyOut ? (
              <>
                <ArrowRight size={18} className="text-error-600" />
                <span className="text-sm font-medium text-error-700">Money Out — {formatINR(amount)}</span>
              </>
            ) : (
              <>
                <ArrowRight size={18} className="text-success-600 rotate-180" />
                <span className="text-sm font-medium text-success-700">Money In — {formatINR(amount)}</span>
              </>
            )}
          </div>
        </div>

        {/* Recovery mode */}
        <div className="card-padded">
          <h3 className="mb-3 text-sm font-semibold text-ink-700">Recovery / Payment Mode</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(recoveryLabels) as RecoveryMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRecoveryMode(m)}
                className={classNames(
                  'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                  recoveryMode === m
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                {recoveryLabels[m]}
              </button>
            ))}
          </div>

          {/* NONE mode — clear message */}
          {noRecovery ? (
            <div className="mt-4 flex items-center gap-3 rounded-md bg-ink-100 px-4 py-3">
              <ArrowLeftRight size={18} className="text-ink-500" />
              <div>
                <p className="text-sm font-medium text-ink-700">No Automatic Recovery</p>
                <p className="text-xs text-ink-500">Money is out with no scheduled collection. You can add manual payments later.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Monthly Amount <span className="label-input">INPUT</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">₹</span>
                  <input type="number" value={monthlyAmount || ''} onChange={(e) => setMonthlyAmount(Number(e.target.value))} className="input pl-7 tabular-nums" />
                </div>
              </div>
              <div>
                <label className="label">Duration (months)</label>
                <input type="number" value={duration || ''} onChange={(e) => setDuration(Number(e.target.value))} className="input tabular-nums" min={1} />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card-padded">
          <label className="label">Notes <span className="text-ink-400">(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={3} placeholder="Any notes about this record…" />
        </div>

        {error && <div className="rounded-md bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            <FileText size={16} /> {submitting ? 'Creating…' : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
}
