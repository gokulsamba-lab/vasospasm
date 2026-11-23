import React from 'react';
import { Activity, ChevronLeft, Clock, Moon01, Sun } from '@untitledui/icons';
import { Tooltip } from '@mui/material';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { PWAInstallButton } from './PWAInstallButton';
import type {
  AppView,
  DataSourceMode,
  HardwareConnectionState,
  PatientProfile,
} from '../types/telemetry';

interface HeaderBarProps {
  activeView: AppView;
  profile: PatientProfile;
  connection: HardwareConnectionState;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onChangeDataSource: (mode: DataSourceMode) => void;
  onBackToDashboard: () => void;
  onOpenDevicePairing: () => void;
}

const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Live Telemetry',
  history: 'Episode History',
  sync: 'Offline Sync',
  diagnostics: 'Diagnostics',
  report: 'Clinical Report',
  ai: 'VasoSense AI',
  account: 'Device Pairing',
};

export function HeaderBar({
  activeView,
  profile,
  connection,
  theme,
  onToggleTheme,
  onChangeDataSource,
  onBackToDashboard,
  onOpenDevicePairing,
}: HeaderBarProps) {
  const rtcLabel = profile.rtcLastSyncedAt
    ? new Date(profile.rtcLastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Unsynced';

  const isSubView =
    activeView === 'diagnostics' || activeView === 'report' || activeView === 'account';

  const transportShort =
    connection.mode === 'ble' ? 'BLE' : connection.mode === 'serial' ? 'USB' : 'Sim';

  return (
    <header className="no-print sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-white/70 dark:bg-[#0B0E1A]/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/65 dark:border-white/12 shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
      {/* Mobile Compact Top App Bar (< lg) */}
      <div className="lg:hidden h-12 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isSubView ? (
            <button
              type="button"
              onClick={onBackToDashboard}
              aria-label="Back to Live Telemetry"
              className="min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] shadow-[0_4px_14px_-4px_rgba(29,140,248,0.55)] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
              {VIEW_TITLES[activeView]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton variant="compact" />

          <button
            type="button"
            onClick={onOpenDevicePairing}
            aria-label="Hardware transport and device pairing"
            className="min-h-[36px] px-2.5 rounded-xl border border-white/70 dark:border-white/15 bg-white/55 dark:bg-white/[0.06] text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connection.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <span>{transportShort}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Clinical Light Mode' : 'Switch to Dark Mode'}
            className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon01 className="w-4 h-4 text-sky-700" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Top Header Bar (>= lg) */}
      <div className="hidden lg:flex h-16 px-6 items-center justify-between gap-4">
        <div className="flex items-center gap-x-2.5 text-xs min-w-0">
          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap truncate">
            {profile.patientId}
          </span>
          <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
            ·
          </span>
          <Badge variant={connection.connected ? 'mint' : 'amber'} className="whitespace-nowrap">
            {profile.boundDeviceName} ({connection.connected ? 'Online' : 'Standby'})
          </Badge>
          <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
            ·
          </span>
          <Tooltip title="MCU Real-Time Clock Synchronization" arrow>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>RTC Sync {rtcLabel}</span>
            </span>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <PWAInstallButton variant="compact" />

          <Tabs
            value={connection.mode}
            onValueChange={(val) => onChangeDataSource(val as DataSourceMode)}
            className="w-auto"
          >
            <TabsList aria-label="Telemetry Data Source">
              {(
                [
                  { id: 'simulator', label: 'Simulator Mode', smLabel: 'Simulator' },
                  { id: 'ble', label: 'Web Bluetooth (BLE)', smLabel: 'BLE' },
                  { id: 'serial', label: 'Web Serial (USB-UART)', smLabel: 'USB-UART' },
                ] as const
              ).map((opt) => (
                <TabsTrigger key={opt.id} value={opt.id} className="min-h-[30px] px-3 py-1">
                  <span className="hidden xl:inline">{opt.label}</span>
                  <span className="xl:hidden">{opt.smLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tooltip title={theme === 'dark' ? 'Switch to Clinical Light Mode' : 'Switch to Dark Mode'} arrow>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Clinical Light Mode' : 'Switch to Dark Mode'}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-white/70 dark:border-white/15 bg-white/55 dark:bg-white/[0.06] backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-white/12 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 transition-all shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon01 className="w-4 h-4 text-sky-700" />}
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
