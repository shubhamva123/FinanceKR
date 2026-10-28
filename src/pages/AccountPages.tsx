import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '@/services';
import type { Account, AccountType, AccountTransaction, Person, TransactionDirection, TransactionStatus, TransactionType } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { PageHeader, LoadingSpinner, ErrorState, EmptyState } from '@/components/common';
import { PageStub } from '@/pages/PageStub';
import { Wallet, ArrowRightLeft, BarChart3, Settings as SettingsIcon, ShieldCheck, Users, CreditCard, ScrollText, BookOpen, Plus, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', type: 'BANK' as AccountType, balance: '0', bankName: '',
    accountNumber: '', creditLimit: '', used: '0', dueDate: '',
  });

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      setAccounts(await api.getAccounts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast('Enter an account name.', 'error');
      return;
    }
    const balance = Number(form.balance);
    const creditLimit = form.creditLimit === '' ? undefined : Number(form.creditLimit);
    const used = form.used === '' ? 0 : Number(form.used);
    if (!Number.isFinite(balance) || balance < 0) {
      toast('Opening balance must be zero or greater.', 'error');
      return;
    }
    if (form.type === 'CARD' && (creditLimit == null || !Number.isFinite(creditLimit) || creditLimit < 0 || !Number.isFinite(used) || used < 0)) {
      toast('Enter a valid credit limit and used amount.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.createAccount({
        name: form.name.trim(),
        type: form.type,
        balance,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        creditLimit,
        used,
        dueDate: form.dueDate || undefined,
      });
      toast('Account created successfully.', 'success');
      setForm({ name: '', type: 'BANK', balance: '0', bankName: '', accountNumber: '', creditLimit: '', used: '0', dueDate: '' });
      setShowForm(false);
      await loadAccounts();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create account.';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalCashAndBank = accounts.filter((a) => a.type === 'CASH' || a.type === 'BANK').reduce((sum, a) => sum + a.balance, 0);
  const totalCreditAvailable = accounts.filter((a) => a.type === 'CARD').reduce((sum, a) => sum + Math.max(0, (a.creditLimit ?? 0) - (a.used ?? 0)), 0);
  const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle={`${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} · Cash, bank, cards and other`}
        actions={<button onClick={() => setShowForm((v) => !v)} className="btn-primary btn-sm"><Wallet size={14} /> {showForm ? 'Cancel' : 'Add Account'}</button>}
      />

      {showForm && (
        <form onSubmit={submit} className="card mb-5 p-5">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Add a bank or cash account</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-ink-700">Account name *
              <input className="input mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. HDFC Current Account" required />
            </label>
            <label className="text-sm font-medium text-ink-700">Account type *
              <select className="input mt-1" value={form.type} onChange={(e) => update('type', e.target.value as AccountType)}>
                <option value="BANK">Bank</option><option value="CASH">Cash</option><option value="CARD">Credit card</option><option value="OTHER">Other</option>
              </select>
            </label>
            <label className="text-sm font-medium text-ink-700">Opening balance (₹) *
              <input className="input mt-1" type="number" min="0" step="0.01" value={form.balance} onChange={(e) => update('balance', e.target.value)} required />
            </label>
            {(form.type === 'BANK' || form.type === 'CARD') && <label className="text-sm font-medium text-ink-700">Bank name
              <input className="input mt-1" value={form.bankName} onChange={(e) => update('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
            </label>}
            {form.type === 'BANK' && <label className="text-sm font-medium text-ink-700">Account number (optional)
              <input className="input mt-1" value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} placeholder="Last 4 digits recommended" />
            </label>}
            {form.type === 'CARD' && <>
              <label className="text-sm font-medium text-ink-700">Credit limit (₹) *
                <input className="input mt-1" type="number" min="0" step="0.01" value={form.creditLimit} onChange={(e) => update('creditLimit', e.target.value)} required />
              </label>
              <label className="text-sm font-medium text-ink-700">Amount used (₹)
                <input className="input mt-1" type="number" min="0" step="0.01" value={form.used} onChange={(e) => update('used', e.target.value)} />
              </label>
              <label className="text-sm font-medium text-ink-700">Payment due date
                <input className="input mt-1" type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
              </label>
            </>}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</button>
          </div>
        </form>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card-padded"><p className="text-xs font-medium uppercase tracking-wide text-ink-500">Cash + bank balance</p><p className="mt-1 text-xl font-bold text-ink-900">{money(totalCashAndBank)}</p></div>
        <div className="card-padded"><p className="text-xs font-medium uppercase tracking-wide text-ink-500">Available credit</p><p className="mt-1 text-xl font-bold text-ink-900">{money(totalCreditAvailable)}</p></div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner label="Loading accounts…" /> : error ? <ErrorState message={error} onRetry={() => void loadAccounts()} /> : accounts.length === 0 ? (
          <EmptyState icon={Wallet} title="No accounts yet" message="Add your first cash, bank, or credit-card account to start tracking balances." action={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>Add Account</button>} />
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"><th className="px-4 py-3">Account</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">Details</th></tr></thead><tbody>
            {accounts.map((account) => <tr key={account.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50"><td className="px-4 py-3 font-medium text-ink-900">{account.name}</td><td className="px-4 py-3"><span className="rounded-full bg-ink-100 px-2 py-1 text-xs text-ink-700">{{ BANK: 'Bank', CASH: 'Cash', CARD: 'Credit card', OTHER: 'Other' }[account.type]}</span></td><td className="px-4 py-3 text-right tabular-nums">{money(account.balance)}</td><td className="px-4 py-3 text-ink-500">{account.bankName || (account.type === 'CARD' ? `Available: ${money(Math.max(0, (account.creditLimit ?? 0) - (account.used ?? 0)))}` : '')}{account.accountNumber ? ` · •••• ${account.accountNumber.slice(-4)}` : ''}{account.dueDate ? ` · Due ${account.dueDate}` : ''}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}


export function AccountDetailPage() {
  return (
    <PageStub
      title="Account Detail"
      subtitle="Balance, transactions, related contracts"
      icon={CreditCard}
      description="Individual account detail with current balance, transaction history, related contracts, and related payments. Actions: add transaction, transfer."
    />
  );
}

export function TransactionsPage() {
  const { toast } = useToast();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(today);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  const [form, setForm] = useState({ date: today, accountId: '', transferToAccountId: '', direction: 'IN' as TransactionDirection, type: 'COLLECTION' as TransactionType, amount: '', description: '', personId: '', status: 'DONE' as TransactionStatus });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [accountRows, peopleResult, txResult] = await Promise.all([
        api.getAccounts(), api.getPeople({ page: 1, pageSize: 500 }), api.getTransactions({ date, page: 1, pageSize: 500 }),
      ]);
      setAccounts(accountRows); setPeople(peopleResult.items); setTransactions(txResult.items);
      setForm((current) => ({ ...current, accountId: current.accountId || accountRows[0]?.id || '', transferToAccountId: current.transferToAccountId || accountRows[1]?.id || '' }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load transactions.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [date]);

  const visibleTransactions = useMemo(() => transactions.filter((t) => statusFilter === 'ALL' || (t.status ?? 'DONE') === statusFilter), [transactions, statusFilter]);
  const pendingTotal = [...new Map(transactions.filter((t) => t.status === 'PENDING').map((t) => [t.transferGroupId ?? t.id, t])).values()].reduce((sum, t) => sum + t.amount, 0);
  const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  const change = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.accountId || !form.description.trim() || !Number.isFinite(amount) || amount <= 0) { toast('Enter an account, description, and valid amount.', 'error'); return; }
    if (form.direction === 'TRANSFER' && (!form.transferToAccountId || form.transferToAccountId === form.accountId)) { toast('Choose a different destination account.', 'error'); return; }
    setSaving(true);
    try {
      await api.createTransaction({ date: form.date, accountId: form.accountId, transferToAccountId: form.direction === 'TRANSFER' ? form.transferToAccountId : undefined, direction: form.direction, type: form.direction === 'TRANSFER' ? 'TRANSFER' : form.type, amount, description: form.description.trim(), personId: form.personId || undefined, status: form.status });
      toast(form.status === 'PENDING' ? 'Pending transaction saved. It will remain on future daily lists until marked done.' : 'Transaction saved.', 'success');
      setShowForm(false); setForm((current) => ({ ...current, amount: '', description: '', personId: '', status: 'DONE' })); await load();
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not save transaction.', 'error'); }
    finally { setSaving(false); }
  };

  const markDone = async (transaction: AccountTransaction) => {
    try { await api.updateTransactionStatus(transaction.id, 'DONE'); toast('Transaction marked done.', 'success'); await load(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not update status.', 'error'); }
  };
  const typeLabel: Record<string, string> = { COLLECTION: 'Borrower collection', DISBURSAL: 'Loan disbursal', INTEREST: 'Interest', EXPENSE: 'Expense', INCOME: 'Income', EMI: 'EMI', CARD_PAYMENT: 'Card payment', TRANSFER: 'Transfer', ADJUSTMENT: 'Adjustment' };

  return <div>
    <PageHeader title="Transactions" subtitle="Date-wise collections, expenses and transfers" actions={<button className="btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}><Plus size={14} /> {showForm ? 'Cancel' : 'Add transaction'}</button>} />
    {showForm && <form onSubmit={submit} className="card mb-5 p-5"><h2 className="mb-4 font-semibold text-ink-900">New transaction</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-ink-700">Transaction / due date *<input className="input mt-1" type="date" value={form.date} onChange={(e) => change('date', e.target.value)} required /></label>
        <label className="text-sm font-medium text-ink-700">Transaction kind *<select className="input mt-1" value={form.direction} onChange={(e) => { const direction = e.target.value as TransactionDirection; change('direction', direction); if (direction === 'OUT') change('type', 'EXPENSE'); if (direction === 'IN') change('type', 'COLLECTION'); }}><option value="IN">Money in / collection</option><option value="OUT">Money out / expense</option><option value="TRANSFER">Transfer between accounts</option></select></label>
        {form.direction !== 'TRANSFER' && <label className="text-sm font-medium text-ink-700">Category *<select className="input mt-1" value={form.type} onChange={(e) => change('type', e.target.value)}>{(form.direction === 'IN' ? [['COLLECTION','Borrower collection'],['INTEREST','Interest'],['INCOME','Other income']] : [['DISBURSAL','Loan disbursal'],['EXPENSE','Expense'],['EMI','EMI'],['CARD_PAYMENT','Card payment']]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
        <label className="text-sm font-medium text-ink-700">Amount (₹) *<input className="input mt-1" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => change('amount', e.target.value)} required /></label>
        <label className="text-sm font-medium text-ink-700">{form.direction === 'TRANSFER' ? 'From account *' : 'Account *'}<select className="input mt-1" value={form.accountId} onChange={(e) => change('accountId', e.target.value)} required><option value="">Select account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        {form.direction === 'TRANSFER' && <label className="text-sm font-medium text-ink-700">To account *<select className="input mt-1" value={form.transferToAccountId} onChange={(e) => change('transferToAccountId', e.target.value)} required><option value="">Select destination</option>{accounts.filter((a) => a.id !== form.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
        {form.direction === 'IN' && form.type === 'COLLECTION' && <label className="text-sm font-medium text-ink-700">Borrower (optional)<select className="input mt-1" value={form.personId} onChange={(e) => change('personId', e.target.value)}><option value="">Select borrower</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        <label className="text-sm font-medium text-ink-700">Status *<select className="input mt-1" value={form.status} onChange={(e) => change('status', e.target.value)}><option value="DONE">Done</option><option value="PENDING">Pending</option></select></label>
        <label className="text-sm font-medium text-ink-700 sm:col-span-2">Description / reference *<input className="input mt-1" value={form.description} onChange={(e) => change('description', e.target.value)} placeholder="e.g. Daily instalment from borrower" required /></label>
      </div><p className="mt-3 text-xs text-ink-500">Pending items appear on subsequent dates until marked Done. Their original date is retained.</p>
      <div className="mt-5 flex justify-end"><button className="btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save transaction'}</button></div>
    </form>}
    <div className="mb-5 flex flex-wrap items-end gap-3"><label className="text-sm font-medium text-ink-700">View date<input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="text-sm font-medium text-ink-700">Status<select className="input mt-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TransactionStatus)}><option value="ALL">All statuses</option><option value="PENDING">Pending only</option><option value="DONE">Done only</option></select></label><button className="btn-secondary btn-sm" onClick={() => void load()}><RefreshCw size={14} /> Refresh</button></div>
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="card-padded"><p className="text-xs uppercase tracking-wide text-ink-500">Transactions shown</p><p className="mt-1 text-xl font-bold text-ink-900">{visibleTransactions.length}</p></div><div className="card-padded"><p className="text-xs uppercase tracking-wide text-ink-500">Pending items shown</p><p className="mt-1 text-xl font-bold text-warning-700">{new Set(transactions.filter((t) => t.status === 'PENDING').map((t) => t.transferGroupId ?? t.id)).size}</p></div><div className="card-padded"><p className="text-xs uppercase tracking-wide text-ink-500">Pending amount shown</p><p className="mt-1 text-xl font-bold text-ink-900">{money(pendingTotal)}</p></div></div>
    <div className="card overflow-hidden">{loading ? <LoadingSpinner label="Loading transactions…" /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : visibleTransactions.length === 0 ? <EmptyState icon={ArrowRightLeft} title="No transactions for this date" message="Add a collection, expense, or transfer. Older pending items are carried into the selected date automatically." action={<button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>Add transaction</button>} /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500"><th className="px-4 py-3">Original date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{visibleTransactions.map((t) => { const status = t.status ?? 'DONE'; const carried = t.date < date && status === 'PENDING'; return <tr key={t.id} className="border-b border-ink-100 last:border-0"><td className="px-4 py-3 whitespace-nowrap">{t.originalDueDate ?? t.date}{carried && <div className="mt-1 text-xs text-warning-700">Carried forward</div>}</td><td className="px-4 py-3"><div className="font-medium text-ink-900">{t.description}</div>{t.personName && <div className="text-xs text-ink-500">{t.personName}</div>}</td><td className="px-4 py-3">{t.accountName}</td><td className="px-4 py-3">{typeLabel[t.type] ?? t.type}</td><td className="px-4 py-3 text-right tabular-nums">{money(t.amount)}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${status === 'DONE' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>{status === 'DONE' ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}{status === 'DONE' ? 'Done' : 'Pending'}</span></td><td className="px-4 py-3">{status === 'PENDING' && <button className="btn-secondary btn-sm" onClick={() => void markDone(t)}>Mark done</button>}</td></tr>; })}</tbody></table></div>}</div>
  </div>;
}

export function ReportsPage() {
  return (
    <PageStub
      title="Monthly Reports"
      subtitle="Financial summary by month"
      icon={BarChart3}
      description="Select year and month to view opening/closing cash, money given, collected, interest received, expenses, EMI paid, card paid, receivable, payable, and overdue. Summary cards, table, and trend charts."
    />
  );
}

export function SettingsPage() {
  return (
    <PageStub
      title="Settings"
      subtitle="Profile, business, users, subscription"
      icon={SettingsIcon}
      description="Profile, business information, users, permissions, subscription management, and preferences. Normal financer users do not see SaaS-wide admin functions."
    />
  );
}

export function LedgerEntryPage() {
  return (
    <PageStub
      title="Ledger (LDA)"
      subtitle="Contract schedule, payments, adjustments"
      icon={BookOpen}
      description="Complete ledger view for a contract: schedule, payment history, adjustments, contract relationships, notes, and activity history."
    />
  );
}

// --- Admin pages ---

export function AdminDashboardPage() {
  return (
    <PageStub
      title="Admin Dashboard"
      subtitle="SaaS platform overview"
      icon={ShieldCheck}
      description="Total financers, active, trial, suspended, MRR, recent signups, recent activity, and system errors. SaaS administrator overview of the entire platform."
    />
  );
}

export function AdminFinancersPage() {
  return (
    <PageStub
      title="Financers"
      subtitle="All businesses on the platform"
      icon={Users}
      description="List of all financers with business name, owner, users, status, subscription, created date, and last activity. Click to view financer detail."
    />
  );
}

export function AdminFinancerDetailPage() {
  return (
    <PageStub
      title="Financer Detail"
      subtitle="Business info, users, subscription, usage"
      icon={Users}
      description="Individual financer detail: business information, users, subscription, usage, account activity, and support access for impersonation."
    />
  );
}

export function AdminUsersPage() {
  return (
    <PageStub
      title="Users"
      subtitle="All users across financers"
      icon={Users}
      description="Platform-wide user list with name, email, financer, role, status, and last login."
    />
  );
}

export function AdminSubscriptionsPage() {
  return (
    <PageStub
      title="Subscriptions"
      subtitle="Billing and plan management"
      icon={CreditCard}
      description="All subscriptions with plan, status, billing period, next billing date, and MRR breakdown."
    />
  );
}

export function AdminAuditPage() {
  return (
    <PageStub
      title="Audit Logs"
      subtitle="Platform activity history"
      icon={ScrollText}
      description="Complete audit log with action, performer, timestamp, details, and severity. Includes sensitive operations like MIC, adjustments, renewals, and admin support access."
    />
  );
}
