import { PageStub } from '@/pages/PageStub';
import { FilePlus, Calendar, FileText, Wallet } from 'lucide-react';

export function LDDPage() {
  return (
    <PageStub
      title="New LDD Entry"
      subtitle="Daily lending / LDD contract"
      icon={FilePlus}
      description="Create a new LDD contract with person, total recovery, daily collection, days, actual amount given, fund source, start date, and date rule. Live preview of calculated fields."
    />
  );
}

export function MonthlyPage() {
  return (
    <PageStub
      title="New Monthly Entry"
      subtitle="Manual, Direct, or Direct 2 lending"
      icon={Calendar}
      description="Create monthly lending contracts with mode selector (MANUAL / DIRECT / DIRECT 2). Each mode shows only relevant fields with live schedule preview."
    />
  );
}

export function ThirdPartyPage() {
  return (
    <PageStub
      title="New Third Party Entry"
      subtitle="Loans, EMIs, family/personal"
      icon={FileText}
      description="Create third-party records: loan given, loan taken, EMI, family/personal, or other. Recovery mode determines which fields appear. NONE mode shows money out with no automatic recovery."
    />
  );
}

export function DuePage() {
  return (
    <PageStub
      title="Due"
      subtitle="Today, upcoming, overdue collections"
      icon={Calendar}
      description="Due collections with tabs for Today, Upcoming, Overdue, and All. Summary of total due, collected, pending, and overdue. Fast collection modal for quick payment entry."
    />
  );
}

export function LedgerPage() {
  return (
    <PageStub
      title="Ledger (LDA)"
      subtitle="Contract schedule, payments, adjustments"
      icon={Wallet}
      description="Complete ledger view for a contract: schedule, payment history, adjustments, contract relationships, notes, and activity history. Actions: receive payment, partial, add-on, renew, MIC, adjustment."
    />
  );
}
