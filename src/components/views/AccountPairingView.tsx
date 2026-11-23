import React, { useState } from 'react';
import {
  BluetoothOn,
  CheckCircle,
  Clock,
  Save01,
  Signal01,
  UsbFlashDrive,
} from '@untitledui/icons';
import { Chip, Tooltip } from '@mui/material';
import type {
  DominantHand,
  HardwareConnectionState,
  PatientProfile,
  RaynaudsType,
} from '../../types/telemetry';
import {
  BAUD_RATE,
  RX_CHAR_UUID,
  SERVICE_UUID,
  TX_CHAR_UUID,
  getHardwareCapabilities,
} from '../../services/hardwareBridge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { PrimeSelect } from '../ui/PrimeSelect';
import { PrimeStatusTag } from '../ui/PrimeStatusTag';
import { PWAInstallButton } from '../PWAInstallButton';

interface AccountPairingViewProps {
  profile: PatientProfile;
  connection: HardwareConnectionState;
  onUpdateProfile: (next: PatientProfile) => void;
  onPairBle: () => Promise<void>;
  onPairSerial: () => Promise<void>;
  onPairSimulated: () => void;
  onSyncRtc: () => Promise<void>;
}

const DOMINANT_HAND_OPTIONS: readonly DominantHand[] = ['Right', 'Left', 'Ambidextrous'];
const MONITORED_HAND_OPTIONS: readonly ('Left' | 'Right')[] = ['Left', 'Right'];
const RAYNAUDS_TYPE_OPTIONS: readonly RaynaudsType[] = [
  'Primary',
  'Secondary (Systemic Sclerosis)',
  'Secondary (Lupus / Mixed CTD)',
  'Unspecified',
];

export function AccountPairingView({
  profile,
  connection,
  onUpdateProfile,
  onPairBle,
  onPairSerial,
  onPairSimulated,
  onSyncRtc,
}: AccountPairingViewProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [dominantHand, setDominantHand] = useState<DominantHand>(profile.dominantHand);
  const [monitoredHand, setMonitoredHand] = useState<'Left' | 'Right'>(profile.monitoredHand);
  const [raynaudsType, setRaynaudsType] = useState<RaynaudsType>(profile.raynaudsType);
  const [baselineTemp, setBaselineTemp] = useState(String(profile.baselineFingertipTempC));
  const [piThresh, setPiThresh] = useState(String(profile.piAlertThresholdPct));
  const [dtThresh, setDtThresh] = useState(String(profile.deltaTAlertThresholdC));
  const [deviceMac, setDeviceMac] = useState(profile.boundDeviceMacOrSerial);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [rtcNotice, setRtcNotice] = useState<string | null>(null);

  const caps = getHardwareCapabilities();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      fullName: fullName.trim() || profile.fullName,
      dominantHand,
      monitoredHand,
      raynaudsType,
      baselineFingertipTempC: Number(baselineTemp) || profile.baselineFingertipTempC,
      piAlertThresholdPct: Number(piThresh) || profile.piAlertThresholdPct,
      deltaTAlertThresholdC: Number(dtThresh) || profile.deltaTAlertThresholdC,
      boundDeviceMacOrSerial: deviceMac.trim() || profile.boundDeviceMacOrSerial,
    });
    setSavedNotice('Clinical parameters and bound hardware ID saved.');
    window.setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSyncRtcClick = async () => {
    await onSyncRtc();
    setRtcNotice(`RTC synchronized at ${new Date().toLocaleTimeString()}`);
    window.setTimeout(() => setRtcNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Account &amp; Hardware Device Pairing
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Bind your FRDM-MCXN236 wearable unit, synchronize the MCU Real-Time Clock, and manage alert thresholds
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Hardware Pairing & RTC Manager */}
        <Card className="xl:col-span-6 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/55 dark:border-white/12 pb-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                FRDM-MCXN236 Pairing &amp; Transport Manager
              </h2>
              <p className="mt-0.5 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                Active Node: {profile.boundDeviceName} · {profile.boundDeviceMacOrSerial}
              </p>
            </div>
            <Badge
              variant={connection.connected ? 'mint' : 'amber'}
              className={connection.connected ? 'shadow-[0_0_16px_-4px_rgba(0,229,153,0.45)]' : ''}
            >
              {connection.connected ? '● Connected' : 'Standby'}
            </Badge>
          </div>

          {connection.errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-amber-300/90 dark:border-[#E08E45]/40 bg-amber-50/90 dark:bg-[#E08E45]/10 text-xs text-amber-900 dark:text-amber-200"
            >
              {connection.errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void onPairBle()}
              className="glass-well w-full min-h-[56px] p-3.5 sm:p-4 rounded-xl hover:bg-white/65 dark:hover:bg-white/[0.08] hover:border-white/90 dark:hover:border-white/25 flex items-center justify-between gap-3 text-left transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <BluetoothOn className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Pair via Web Bluetooth (BLE UART)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {caps.bleSupported
                      ? 'Scans for VasoSense-MCXN236 Nordic UART GATT profile'
                      : 'Web Bluetooth unavailable in this browser context'}
                  </div>
                </div>
              </div>
              <Tooltip title={caps.bleSupported ? 'Web Bluetooth Ready' : 'Requires HTTPS / Chromium'} arrow>
                <span className="inline-flex items-center gap-2 shrink-0">
                  <Chip
                    size="small"
                    label={caps.bleSupported ? 'Ready' : 'N/A'}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: caps.bleSupported ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.16)',
                      color: caps.bleSupported ? '#38BDF8' : '#94A3B8',
                    }}
                  />
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Connect BLE</span>
                </span>
              </Tooltip>
            </button>

            <button
              type="button"
              onClick={() => void onPairSerial()}
              className="glass-well w-full min-h-[56px] p-3.5 sm:p-4 rounded-xl hover:bg-white/65 dark:hover:bg-white/[0.08] hover:border-white/90 dark:hover:border-white/25 flex items-center justify-between gap-3 text-left transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <UsbFlashDrive className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Pair via Web Serial (USB-UART @ {BAUD_RATE} baud)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {caps.serialSupported
                      ? 'Direct MCU-Link VCOM port connection for bench testing'
                      : 'Web Serial unavailable in this browser context'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 shrink-0">Select Port</span>
            </button>

            <button
              type="button"
              onClick={onPairSimulated}
              className="glass-well w-full min-h-[56px] p-3.5 sm:p-4 rounded-xl hover:bg-white/65 dark:hover:bg-white/[0.08] hover:border-white/90 dark:hover:border-white/25 flex items-center justify-between gap-3 text-left transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Signal01 className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Simulated Device Pairing (Bench Emulation)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Instant simulated FRDM-MCXN236 telemetry stream without physical hardware
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                Activate Sim
              </span>
            </button>
          </div>

          {/* One-Click Sync RTC Time */}
          <div className="pt-4 border-t border-white/55 dark:border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">MCU Real-Time Clock (RTC)</span>
                <PrimeStatusTag
                  value={profile.rtcLastSyncedAt ? 'Synced' : 'Pending'}
                  tone={profile.rtcLastSyncedAt ? 'mint' : 'amber'}
                />
              </div>
              <div className="font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                Last Synced:{' '}
                {profile.rtcLastSyncedAt
                  ? new Date(profile.rtcLastSyncedAt).toLocaleString()
                  : 'Never synced'}
              </div>
              {rtcNotice && (
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">{rtcNotice}</div>
              )}
            </div>

            <Button type="button" size="lg" onClick={() => void handleSyncRtcClick()} className="shrink-0">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sync RTC Time</span>
            </Button>
          </div>

          {/* GATT / Serial Protocol Reference */}
          <div className="glass-well p-3.5 rounded-xl text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 space-y-1 break-all">
            <div>SERVICE_UUID: {SERVICE_UUID}</div>
            <div>TX_CHAR_UUID: {TX_CHAR_UUID}</div>
            <div>RX_CHAR_UUID: {RX_CHAR_UUID}</div>
            <div>UART_BAUD_RATE: {BAUD_RATE} bps (8N1)</div>
          </div>
        </Card>

        {/* Patient Clinical Settings Form */}
        <Card className="xl:col-span-6 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-white/55 dark:border-white/12 pb-4">
            Patient Clinical Parameters &amp; Alert Thresholds
          </h2>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="acc-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Patient Full Name
                </label>
                <Input
                  id="acc-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="acc-mac" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bound Hardware MAC / Serial
                </label>
                <Input
                  id="acc-mac"
                  type="text"
                  value={deviceMac}
                  onChange={(e) => setDeviceMac(e.target.value)}
                  className="mt-1.5 font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="acc-dom" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Dominant Hand
                </label>
                <PrimeSelect
                  inputId="acc-dom"
                  ariaLabel="Dominant Hand"
                  value={dominantHand}
                  options={DOMINANT_HAND_OPTIONS}
                  onChange={(val) => setDominantHand(val as DominantHand)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="acc-mon" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Monitored Hand
                </label>
                <PrimeSelect
                  inputId="acc-mon"
                  ariaLabel="Monitored Hand"
                  value={monitoredHand}
                  options={MONITORED_HAND_OPTIONS}
                  onChange={(val) => setMonitoredHand(val as 'Left' | 'Right')}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="acc-raynauds" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Raynaud&apos;s Classification
              </label>
              <PrimeSelect
                inputId="acc-raynauds"
                ariaLabel="Raynaud's Classification"
                value={raynaudsType}
                options={RAYNAUDS_TYPE_OPTIONS}
                onChange={(val) => setRaynaudsType(val as RaynaudsType)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="acc-temp" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Baseline Temp (°C)
                </label>
                <Input
                  id="acc-temp"
                  type="number"
                  step="0.1"
                  value={baselineTemp}
                  onChange={(e) => setBaselineTemp(e.target.value)}
                  className="mt-1.5 font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="acc-pi" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  PI Threshold (%)
                </label>
                <Input
                  id="acc-pi"
                  type="number"
                  step="0.1"
                  value={piThresh}
                  onChange={(e) => setPiThresh(e.target.value)}
                  className="mt-1.5 font-mono tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="acc-dt" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  ΔT Threshold (°C)
                </label>
                <Input
                  id="acc-dt"
                  type="number"
                  step="0.1"
                  value={dtThresh}
                  onChange={(e) => setDtThresh(e.target.value)}
                  className="mt-1.5 font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Button type="submit" size="lg">
                <Save01 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Clinical Settings</span>
              </Button>

              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00E599]">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  <span>{savedNotice}</span>
                </span>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Mobile App & Offline Installation Card */}
      <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Mobile Application &amp; Offline Home Screen Install
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Install VasoSense Clinical onto your iPhone, iPad, or Android device for standalone full-screen operation,
            thumb-zone navigation, and offline service-worker asset caching. Android Chrome supports direct Web
            Bluetooth (BLE) pairing to the FRDM-MCXN236 wrist node.
          </p>
        </div>
        <div className="w-full sm:w-64 shrink-0">
          <PWAInstallButton variant="full" />
        </div>
      </Card>
    </div>
  );
}
