/**
 * Indian numbering system currency formatter.
 * Formats as ₹1,00,000 (lakh/crore notation).
 */
export function formatINR(amount: number, opts?: { showSign?: boolean }): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  // Indian grouping: last 3 digits, then groups of 2
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const sign = isNegative ? '-' : opts?.showSign ? '+' : '';
  return `${sign}₹${formatted}`;
}

/** Short currency for tight spaces — ₹1.0L, ₹1.2Cr, ₹9K */
export function formatINRShort(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let str: string;
  if (abs >= 10000000) {
    str = `₹${(abs / 10000000).toFixed(1)}Cr`;
  } else if (abs >= 100000) {
    str = `₹${(abs / 100000).toFixed(1)}L`;
  } else if (abs >= 1000) {
    str = `₹${(abs / 1000).toFixed(0)}K`;
  } else {
    str = `₹${abs.toLocaleString('en-IN')}`;
  }

  return isNegative ? `-${str}` : str;
}

export function formatDate(date: string | Date, fmt: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  if (fmt === 'long') {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatRelativeDays(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const f = typeof from === 'string' ? new Date(from) : from;
  const t = typeof to === 'string' ? new Date(to) : to;
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
