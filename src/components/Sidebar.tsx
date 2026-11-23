import React from 'react';
import {
  Activity,
  Clock,
  CpuChip01,
  File06,
  HardDrive,
  Link03,
  LogOut01,
  Stars02,
  XClose,
} from '@untitledui/icons';
import { Button } from './ui/button';
import type { AppView, HardwareConnectionState, PatientProfile } from '../types/telemetry';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  profile: PatientProfile;
  connection: HardwareConnectionState;
  batteryPct: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Live Telemetry Dashboard', icon: Activity },
  { id: 'history', label: 'Episode History & Recovery', icon: Clock },
  { id: 'sync', label: 'Offline SD / Flash Sync', icon: HardDrive },
  { id: 'diagnostics', label: 'Hardware Diagnostics', icon: CpuChip01 },
  { id: 'report', label: 'Clinical Report Generator', icon: File06 },
  { id: 'ai', label: 'AI Assistant & FAQ Guide', icon: Stars02 },
  { id: 'account', label: 'Account & Device Pairing', icon: Link03 },
];

export function Sidebar({
  activeView,
  onSelectView,
  profile,
  connection,
  batteryPct,
  mobileOpen,
  onCloseMobile,
  onSignOut,
}: SidebarProps) {
  const handleSelect = (view: AppView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white/52 dark:bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 border-r border-white/65 dark:border-white/12 shadow-[inset_-1px_0_0_rgba(255,255,255,0.45)] dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] w-72 shrink-0">
      {/* Brand Mark */}
      <div className="h-16 px-5 flex items-center justify-between gap-2 border-b border-white/55 dark:border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_18px_-4px_rgba(29,140,248,0.6)] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            VasoSense Clinical
          </span>
        </div>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
          >
            <XClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Patient Profile Summary */}
      <div className="px-4 py-4 border-b border-white/55 dark:border-white/10">
        <div className="glass-well flex items-center gap-3 p-3 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400/25 to-cyan-400/20 text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center justify-center shrink-0 ring-1 ring-sky-400/35">
            {profile.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {profile.fullName}
            </p>
            <p className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 truncate">
              {profile.patientId} · {profile.monitoredHand} Hand
            </p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Clinical Telemetry Navigation" className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`w-full min-h-[42px] flex items-center gap-3 px-3.5 py-2.5 text-left text-xs font-medium rounded-xl transition-all duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                active
                  ? 'bg-gradient-to-r from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_22px_-4px_rgba(29,140,248,0.55)]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/55 dark:hover:bg-white/[0.07] hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Paired Hardware Connection Summary */}
      <div className="p-4 border-t border-white/55 dark:border-white/10 space-y-3">
        <div className="glass-well p-3.5 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Paired Node</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{batteryPct}% Batt</span>
          </div>
          <div className="font-semibold text-slate-900 dark:text-white truncate">
            {profile.boundDeviceName}
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                connection.connected
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]'
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">
              {connection.connected ? `Streaming · ${connection.transportDetail}` : 'Standby'}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onSignOut}
          className="w-full"
        >
          <LogOut01 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 relative z-20">{navContent}</aside>

      {/* Mobile / tablet slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl">{navContent}</div>
        </div>
      )}
    </>
  );
}
