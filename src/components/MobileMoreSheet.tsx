import React from 'react';
import {
  ChevronRight,
  CpuChip01,
  File06,
  Link03,
  LogOut01,
  XClose,
} from '@untitledui/icons';
import type {
  AppView,
  DataSourceMode,
  HardwareConnectionState,
  PatientProfile,
} from '../types/telemetry';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileMoreSheetProps {
  open: boolean;
  activeView: AppView;
  profile: PatientProfile;
  connection: HardwareConnectionState;
  batteryPct: number;
  onClose: () => void;
  onSelectView: (view: AppView) => void;
  onChangeDataSource: (mode: DataSourceMode) => void;
  onSignOut: () => void;
}

const SECONDARY_ITEMS: Array<{
  id: AppView;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'diagnostics',
    title: 'Hardware Diagnostics',
    subtitle: '5-node sensor check & 30s baseline wizard',
    icon: CpuChip01,
  },
  {
    id: 'report',
    title: 'Clinical Report',
    subtitle: 'Rheumatology summary & symptom concordance',
    icon: File06,
  },
  {
    id: 'account',
    title: 'Device Pairing & Thresholds',
    subtitle: 'BLE / USB-UART binding, RTC sync & alerts',
    icon: Link03,
  },
];

export function MobileMoreSheet({
  open,
  activeView,
  profile,
  connection,
  batteryPct,
  onClose,
  onSelectView,
  onChangeDataSource,
  onSignOut,
}: MobileMoreSheetProps) {
  if (!open) return null;

  const handleNavigate = (view: AppView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div className="no-print lg:hidden fixed inset-0 z-50 flex items-end">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Clinical Tools and App Menu"
        className="glass-surface relative z-10 w-full rounded-t-3xl p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-h-[86vh] overflow-y-auto shadow-2xl space-y-4"
      >
        {/* Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" aria-hidden="true" />

        {/* Patient & Device Summary Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white font-semibold text-xs flex items-center justify-center shrink-0">
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
              <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                {profile.patientId} · {profile.boundDeviceName} · {batteryPct}%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close app menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
          >
            <XClose className="w-4 h-4" />
          </button>
        </div>

        {/* Data Source Quick Switcher */}
        <div className="glass-well rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Telemetry Transport
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              {connection.connected ? connection.transportDetail : 'Standby'}
            </span>
          </div>
          <Tabs
            value={connection.mode}
            onValueChange={(val) => onChangeDataSource(val as DataSourceMode)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="simulator" className="min-h-[38px] text-xs">
                Simulator
              </TabsTrigger>
              <TabsTrigger value="ble" className="min-h-[38px] text-xs">
                BLE UART
              </TabsTrigger>
              <TabsTrigger value="serial" className="min-h-[38px] text-xs">
                USB-UART
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Clinical Tools Tap Rows */}
        <div className="glass-well rounded-2xl divide-y divide-slate-200/60 dark:divide-white/10 overflow-hidden">
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full min-h-[56px] px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-colors active:bg-white/60 dark:active:bg-white/10 ${
                  active ? 'bg-sky-500/10 dark:bg-sky-400/12' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      active
                        ? 'bg-[#1F75FE] text-white'
                        : 'bg-sky-500/12 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Install Mobile App + Sign Out */}
        <div className="space-y-2.5 pt-1">
          <PWAInstallButton variant="full" />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full min-h-[44px]"
          >
            <LogOut01 className="w-4 h-4" aria-hidden="true" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
