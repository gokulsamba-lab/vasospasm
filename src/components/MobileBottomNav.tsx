import React from 'react';
import {
  Activity,
  Clock,
  Grid01,
  HardDrive,
  Stars02,
} from '@untitledui/icons';
import type { AppView } from '../types/telemetry';

interface MobileBottomNavProps {
  activeView: AppView;
  moreOpen: boolean;
  onSelectView: (view: AppView) => void;
  onOpenMore: () => void;
}

const PRIMARY_TABS: Array<{
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Live', icon: Activity },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'sync', label: 'Sync', icon: HardDrive },
  { id: 'ai', label: 'AI Guide', icon: Stars02 },
];

export function MobileBottomNav({
  activeView,
  moreOpen,
  onSelectView,
  onOpenMore,
}: MobileBottomNavProps) {
  const isMoreView =
    activeView === 'diagnostics' || activeView === 'report' || activeView === 'account';

  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/88 dark:bg-[#0B0E1A]/90 backdrop-blur-2xl backdrop-saturate-150 border-t border-slate-200/80 dark:border-white/12 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.75)]"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-lg mx-auto px-1">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = !moreOpen && activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
                active
                  ? 'text-[#1F75FE] dark:text-[#38BDF8]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#1F75FE] dark:bg-[#38BDF8]"
                />
              )}
              <Icon className="w-[20px] h-[20px] shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-semibold tracking-tight leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenMore}
          aria-expanded={moreOpen}
          aria-label="Open more tools and device settings"
          className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
            moreOpen || isMoreView
              ? 'text-[#1F75FE] dark:text-[#38BDF8]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {(moreOpen || isMoreView) && (
            <span
              aria-hidden="true"
              className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#1F75FE] dark:bg-[#38BDF8]"
            />
          )}
          <Grid01 className="w-[20px] h-[20px] shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-tight leading-none whitespace-nowrap">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
