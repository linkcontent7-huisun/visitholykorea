import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="px-10 py-20 text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-gray-100">
        <Icon size={32} className="text-gray-300" />
      </div>
      <h4 className="mb-3 text-lg font-bold tracking-tight text-app-text">{title}</h4>
      {description && (
        <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-app-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
