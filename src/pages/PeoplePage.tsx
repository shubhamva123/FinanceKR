import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import type { Person } from '@/types';
import { PageHeader, LoadingSpinner, ErrorState, EmptyState, Badge } from '@/components/common';
import { formatINR, formatDate, classNames } from '@/utils/format';
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Phone,
  UserCircle,
} from 'lucide-react';
import { PageStub } from '@/pages/PageStub';

export function PersonDetailPage() {
  return (
    <PageStub
      title="Person Detail"
      subtitle="Profile, contracts, payments, notes"
      icon={UserCircle}
      description="Full person profile with contacts, active and closed contracts, outstanding, overdue, recent payments, notes, documents, and activity history."
    />
  );
}

type SortField = 'name' | 'totalOutstanding' | 'totalOverdue' | 'activeContracts' | 'lastActivity';

export function PeoplePage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.getPeople({
      search: search || undefined,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      pageSize,
      sortBy,
      sortDir,
    })
      .then((res) => { setPeople(res.items); setTotal(res.total); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [search, statusFilter, sortBy, sortDir, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { if (page !== 1) setPage(1); else load(); }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / pageSize);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      className={classNames('ml-1 inline', sortBy === field ? 'text-primary-600' : 'text-ink-300')}
    />
  );

  return (
    <div>
      <PageHeader
        title="People"
        subtitle={`${total} ${total === 1 ? 'person' : 'people'} total`}
        actions={
          <button onClick={() => navigate('/people/new')} className="btn-primary btn-sm">
            <UserPlus size={14} /> Add Person
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-md border border-ink-200 bg-white p-0.5">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={classNames(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {s === 'ALL' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading people…" />
        ) : error ? (
          <ErrorState message="Could not load people." onRetry={load} />
        ) : people.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No people yet"
            message="Add your first person to start creating contracts and tracking collections."
            action={<button onClick={() => navigate('/people/new')} className="btn-primary btn-sm"><UserPlus size={14} /> Add Person</button>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3 cursor-pointer hover:text-ink-700" onClick={() => toggleSort('name')}>Person <SortIcon field="name" /></th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 cursor-pointer text-right hover:text-ink-700" onClick={() => toggleSort('activeContracts')}>Contracts <SortIcon field="activeContracts" /></th>
                    <th className="px-4 py-3 cursor-pointer text-right hover:text-ink-700" onClick={() => toggleSort('totalOutstanding')}>Outstanding <SortIcon field="totalOutstanding" /></th>
                    <th className="px-4 py-3 cursor-pointer text-right hover:text-ink-700" onClick={() => toggleSort('totalOverdue')}>Overdue <SortIcon field="totalOverdue" /></th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-ink-700" onClick={() => toggleSort('lastActivity')}>Last Activity <SortIcon field="lastActivity" /></th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {people.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/people/${p.id}`)}
                      className="table-row-clickable"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-medium text-ink-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{p.phone}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-700">{p.activeContracts}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-900">{formatINR(p.totalOutstanding)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.totalOverdue > 0 ? <span className="font-semibold text-error-600">{formatINR(p.totalOverdue)}</span> : <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-4 py-3"><Badge status={p.status} /></td>
                      <td className="px-4 py-3 text-xs text-ink-500">{formatDate(p.lastActivity, 'long')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-medium text-primary-600">Open →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-ink-100 lg:hidden">
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/people/${p.id}`)}
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-ink-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-medium text-ink-900">{p.name}</span>
                    </div>
                    <Badge status={p.status} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-500">
                    <Phone size={12} /> {p.phone}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-500">{p.activeContracts} contracts</span>
                    <span className="font-semibold tabular-nums text-ink-900">{formatINR(p.totalOutstanding)}</span>
                  </div>
                  {p.totalOverdue > 0 && (
                    <div className="text-right text-xs font-semibold text-error-600">Overdue: {formatINR(p.totalOverdue)}</div>
                  )}
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-200 px-4 py-3">
                <p className="text-xs text-ink-500">
                  Page {page} of {totalPages} • {total} total
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-icon disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-icon disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
