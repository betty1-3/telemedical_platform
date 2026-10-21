import React from 'react';
import { ChevronRightIcon, ServerIcon } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api/config';
import type { NavItem } from '../../data/navigation';

interface TopbarProps {
  section: string;
  item: NavItem;
}

export function Topbar({ section, item }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[#f7f3e8]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-2xs text-ink-soft">
              <li>MediCore</li>
              <li aria-hidden="true">
                <ChevronRightIcon size={11} />
              </li>
              <li>{section}</li>
              <li aria-hidden="true">
                <ChevronRightIcon size={11} />
              </li>
              <li className="font-medium text-ink-muted" aria-current="page">
                {item.label}
              </li>
            </ol>
          </nav>
          <h1 className="mt-0.5 truncate font-editorial text-2xl font-semibold tracking-tight text-ink">{item.label}</h1>
          <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 rounded border border-line bg-canvas px-2.5 py-1.5 text-2xs text-ink-muted">
          <ServerIcon size={12} aria-hidden="true" className="text-brand-600" />
          <span className="font-mono">{API_BASE_URL}</span>
        </div>
      </div>
    </header>);

}
