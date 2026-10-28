import { PageHeader } from '@/components/common';
import { Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PageStubProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  description: string;
  actions?: React.ReactNode;
}

export function PageStub({ title, subtitle, icon: Icon, description, actions }: PageStubProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="card-padded">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-primary-50 p-5">
            <Icon size={32} className="text-primary-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-700">{title}</h2>
            <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warning-100 px-3 py-1 text-xs font-medium text-warning-700">
            <Construction size={14} />
            Coming in next phase
          </div>
        </div>
      </div>
    </div>
  );
}
