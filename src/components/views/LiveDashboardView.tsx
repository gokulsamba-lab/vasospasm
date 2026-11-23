import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell01,
  BellOff01,
  CheckCircle,
  Eye,
  Flag02,
  Plus,
  ShieldTick,
  Signal01,
  Thermometer02,
} from '@untitledui/icons';
import { Chip, LinearProgress, Slider, Switch } from '@mui/material';
import type {
  DataSourceMode,
  EpisodeTrigger,
  PatientProfile,
  RaynaudsStage,
  SimulatorScenario,
  SymptomLog,
  TelemetryPacket,
} from '../../types/telemetry';
import { PpgWaveformCanvas } from '../PpgWaveformCanvas';
import { SynchronizedChart, type ChartPoint } from '../SynchronizedChart';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PrimeSelect } from '../ui/PrimeSelect';
import { PrimeStatusTag } from '../ui/PrimeStatusTag';
import { MiniSparkline } from '../ui/MiniSparkline';
import { BiometricRingGauge } from '../ui/BiometricRingGauge';
import { ZoneSplitBar } from '../ui/ZoneSplitBar';

interface LiveDashboardViewProps {
  packet: TelemetryPacket;
  history: ChartPoint[];
  profile: PatientProfile;
  dataSourceMode: DataSourceMode;
  scenario: SimulatorScenario;
  onSelectScenario: (scenario: SimulatorScenario) => void;
  onTriggerHwButton: () => void;
  rollingWindowProgressSec: number;
  alertsEnabled: boolean;
  onToggleAlerts: () => void;
  symptomLogs: SymptomLog[];
  onAddSymptomLog: (entry: Omit<SymptomLog, 'id' | 'timestamp' | 'piAtEvent' | 'deltaTAtEvent'>) => void;
  onAnnotateSymptomLog: (id: string, updates: Partial<SymptomLog>) => void;
  theme: 'light' | 'dark';
}

export function LiveDashboardView({
  packet,
  history,
  profile,
  dataSourceMode,
  scenario,
  onSelectScenario,
  onTriggerHwButton,
  rollingWindowProgressSec,
  alertsEnabled,
  onToggleAlerts,
  symptomLogs,
  onAddSymptomLog,
  onAnnotateSymptomLog,
  theme,
}: LiveDashboardViewProps) {
  const [trigger, setTrigger] = useState<EpisodeTrigger>('Cold Exposure');
  const [stage, setStage] = useState<RaynaudsStage>('White (Pallor)');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSymptomLog({
      source: 'manual_entry',
      trigger,
      stage,
      severity,
      notes: notes.trim() || `Manual patient log (${stage})`,
      annotated: true,
    });
    setNotes('');
  };

  // Classification Banner Mapping
  const classificationConfig =
    packet.high_motion_flag
      ? {
          title: 'Window Discarded — High Motion Artifact',
          detail: 'LIS3DH variance exceeded stability gate; Cortex-M33 inference paused until hand stabilizes.',
          toneClass:
            'glass-surface ring-1 ring-amber-400/55 dark:ring-amber-400/40 text-amber-950 dark:text-slate-100 shadow-[0_14px_38px_-10px_rgba(245,158,11,0.28)]',
          accentHex: '#F59E0B',
          chipBg: theme === 'dark' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(254, 243, 199, 0.85)',
          chipText: theme === 'dark' ? '#FBBF24' : '#B45309',
          icon: AlertTriangle,
        }
      : packet.ml_class === 2
      ? {
          title: 'Active Vasospasm Detected',
          detail: 'Severe digital vasoconstriction confirmed across PPG perfusion drop, ΔT cooling, and spectral pallor.',
          toneClass:
            'glass-surface ring-1 ring-rose-400/55 dark:ring-rose-500/45 text-rose-950 dark:text-slate-100 shadow-[0_14px_38px_-10px_rgba(244,63,94,0.32)]',
          accentHex: '#F43F5E',
          chipBg: theme === 'dark' ? 'rgba(244, 63, 94, 0.16)' : 'rgba(255, 228, 230, 0.85)',
          chipText: theme === 'dark' ? '#FB7185' : '#BE123C',
          icon: ShieldTick,
        }
      : packet.ml_class === 1
      ? {
          title: 'Vasospasm Risk: Elevated (Pre-Vasospasm Cooling)',
          detail: 'Progressive fingertip cooling gradient and reduced pulsatile amplitude detected.',
          toneClass:
            'glass-surface ring-1 ring-amber-400/55 dark:ring-amber-400/40 text-amber-950 dark:text-slate-100 shadow-[0_14px_38px_-10px_rgba(245,158,11,0.28)]',
          accentHex: '#F59E0B',
          chipBg: theme === 'dark' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(254, 243, 199, 0.85)',
          chipText: theme === 'dark' ? '#FBBF24' : '#B45309',
          icon: AlertTriangle,
        }
      : {
          title: 'Normal Microvascular Flow',
          detail: 'Pulsatile arterial perfusion and distal-dorsal thermal balance remain within resting baseline.',
          toneClass:
            'glass-surface ring-1 ring-emerald-400/45 dark:ring-emerald-400/35 text-emerald-950 dark:text-slate-100 shadow-[0_14px_38px_-10px_rgba(16,185,129,0.22)]',
          accentHex: '#10B981',
          chipBg: theme === 'dark' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(209, 250, 229, 0.85)',
          chipText: theme === 'dark' ? '#34D399' : '#047857',
          icon: CheckCircle,
        };

  const StatusIcon = classificationConfig.icon;
  const rollingPct = Math.min(100, Math.round((rollingWindowProgressSec / 30) * 100));
  const rgbCss = `rgb(${packet.rgb_r}, ${packet.rgb_g}, ${packet.rgb_b})`;
  const trackColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.10)';
  const ringTextColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';

  // Compute history zone distribution for React-Bootstrap stacked zone bar
  const totalPts = Math.max(1, history.length);
  const normalZonePct = (history.filter((p) => p.packet.ml_class === 0).length / totalPts) * 100;
  const coolingZonePct = (history.filter((p) => p.packet.ml_class === 1).length / totalPts) * 100;
  const spasmZonePct = (history.filter((p) => p.packet.ml_class === 2).length / totalPts) * 100;

  return (
    <div className="space-y-6">
      {/* Simulation Control Toolbar (visible in Simulator Mode) */}
      {dataSourceMode === 'simulator' && (
        <Card
          role="region"
          aria-label="Physiological Simulation Controls"
          className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5"
        >
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Simulator Controls</span>
            <span className="text-slate-400 dark:text-slate-600 mx-2" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Inject physiological waveforms to test Cortex-M33 classification
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {(
              [
                { id: 'normal', label: 'Normal Perfusion', mobileLabel: 'Normal' },
                { id: 'cooling', label: 'Cold Exposure / Cooling Trend', mobileLabel: 'Cooling' },
                { id: 'vasospasm', label: 'Active Vasospasm Episode', mobileLabel: 'Vasospasm' },
                { id: 'motion_artifact', label: 'High Motion Artifact (LIS3DH Discard)', mobileLabel: 'Motion Gate' },
              ] as const
            ).map((btn) => {
              const active = scenario === btn.id;
              return (
                <Button
                  key={btn.id}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => onSelectScenario(btn.id)}
                  className="min-h-[44px] sm:min-h-[36px] justify-center"
                >
                  <span className="hidden sm:inline">{btn.label}</span>
                  <span className="sm:hidden">{btn.mobileLabel}</span>
                </Button>
              );
            })}

            <Button
              type="button"
              variant="destructive"
              onClick={onTriggerHwButton}
              className="col-span-2 sm:col-span-1 min-h-[44px] sm:min-h-[36px] justify-center"
            >
              <Flag02 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Simulate Hardware Event Button Press</span>
              <span className="sm:hidden">Simulate MCU Event Button</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Row 1: AI Classification & System Status Banner (Whoop Ring Gauge + Frosted Glass Card) */}
      <section
        aria-label="Cortex-M33 Classification Status"
        className={`p-5 rounded-2xl transition-all duration-200 ${classificationConfig.toneClass} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          <BiometricRingGauge
            value={Math.round(packet.ml_confidence * 100)}
            min={0}
            max={100}
            size={68}
            strokeWidth={8}
            color={classificationConfig.accentHex}
            trackColor={trackColor}
            textColor={ringTextColor}
            displayText={`${Math.round(packet.ml_confidence * 100)}%`}
            tooltip="Cortex-M33 Inference Confidence"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <StatusIcon
                className="w-5 h-5 shrink-0"
                style={{ color: classificationConfig.accentHex }}
                aria-hidden="true"
              />
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-balance">
                {classificationConfig.title}
              </h1>
              <Chip
                size="small"
                label={`Confidence ${(packet.ml_confidence * 100).toFixed(1)}% · Class ${packet.ml_class}`}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  bgcolor: classificationConfig.chipBg,
                  color: classificationConfig.chipText,
                  border: `1px solid ${classificationConfig.accentHex}44`,
                }}
              />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {classificationConfig.detail}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0">
          <div className="w-full sm:w-auto min-w-52">
            <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums mb-1.5">
              <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">Rolling Window (8–30s)</span>
              <span className="whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                {rollingWindowProgressSec}s / 30s
              </span>
            </div>
            <LinearProgress
              variant="determinate"
              value={rollingPct}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: trackColor,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  bgcolor: classificationConfig.accentHex,
                },
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onToggleAlerts}
            aria-pressed={alertsEnabled}
            className="gap-2.5"
          >
            {alertsEnabled ? (
              <>
                <Bell01 className="w-3.5 h-3.5 text-[#00D18A]" aria-hidden="true" />
                <span>Audio/Visual Alerts On</span>
              </>
            ) : (
              <>
                <BellOff01 className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Alerts Muted</span>
              </>
            )}
            <Switch
              checked={alertsEnabled}
              size="small"
              tabIndex={-1}
              aria-hidden="true"
              sx={{
                pointerEvents: 'none',
                ml: 0.25,
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#00E599' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#00D18A' },
              }}
            />
          </Button>
        </div>
      </section>

      {/* Row 2: 4 Multi-Modal Sensor KPI Cards (Video Ring Triad + Obsidian Elevated Cards) */}
      <section
        aria-label="Multi-Modal Microvascular Sensor Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Card 1: Perfusion Index (MAX30102) */}
        <Card className="p-4 sm:p-5 hover:border-white/90 dark:hover:border-white/25 flex flex-col justify-between gap-3.5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  MAX30102 · Perfusion
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums whitespace-nowrap text-sky-600 dark:text-sky-400">
                SNR {packet.ppg_snr.toFixed(1)} dB
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline flex-wrap gap-x-1">
                  <span className="text-[22px] 2xl:text-[26px] font-mono tabular-nums font-semibold text-slate-900 dark:text-white leading-none">
                    {packet.perfusion_index.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">% PI</span>
                </div>
                <div className="mt-1.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 leading-snug">
                  AC {packet.ppg_ac.toFixed(1)} / DC {packet.ppg_dc.toFixed(0)} ·{' '}
                  {packet.ppg_snr >= 15 ? 'Signal Good' : 'Low SNR'}
                </div>
              </div>

              <div className="shrink-0">
                <BiometricRingGauge
                  value={Math.min(100, Math.round((packet.perfusion_index / 4.0) * 100))}
                  size={48}
                  strokeWidth={7}
                  color={packet.perfusion_index < profile.piAlertThresholdPct ? '#F43F5E' : '#38BDF8'}
                  trackColor={trackColor}
                  textColor={ringTextColor}
                  displayText={`${packet.perfusion_index.toFixed(1)}`}
                  tooltip="Perfusion Index vs 4.0% Peak"
                />
              </div>
            </div>
          </div>

          <PpgWaveformCanvas
            perfusionIndex={packet.perfusion_index}
            highMotion={packet.high_motion_flag}
            mlClass={packet.ml_class}
            theme={theme}
          />
        </Card>

        {/* Card 2: Thermal Gradient (Dual TMP117) */}
        <Card className="p-4 sm:p-5 hover:border-white/90 dark:hover:border-white/25 flex flex-col justify-between gap-3.5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Thermometer02 className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Dual TMP117 · Thermal
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums whitespace-nowrap text-amber-600 dark:text-amber-400">
                {packet.cooling_rate >= 0 ? '+' : ''}
                {packet.cooling_rate.toFixed(2)} °C/m
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline flex-wrap gap-x-1">
                  <span
                    className={`text-[22px] 2xl:text-[26px] font-mono tabular-nums font-semibold leading-none ${
                      packet.delta_t <= profile.deltaTAlertThresholdC
                        ? 'text-rose-600 dark:text-rose-400'
                        : packet.delta_t <= -2.0
                        ? 'text-amber-600 dark:text-[#E08E45]'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {packet.delta_t >= 0 ? '+' : ''}
                    {packet.delta_t.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">°C ΔT</span>
                </div>
                <MiniSparkline
                  values={history.slice(-16).map((p) => p.packet.delta_t)}
                  color={packet.delta_t <= profile.deltaTAlertThresholdC ? '#F43F5E' : '#E08E45'}
                  min={-12}
                  max={1}
                  className="w-24 h-6"
                />
              </div>

              <div className="shrink-0">
                <BiometricRingGauge
                  value={Math.max(5, Math.min(100, Math.round(((12 + packet.delta_t) / 13) * 100)))}
                  size={48}
                  strokeWidth={7}
                  color={
                    packet.delta_t <= profile.deltaTAlertThresholdC
                      ? '#F43F5E'
                      : packet.delta_t <= -2.0
                      ? '#E08E45'
                      : '#00D18A'
                  }
                  trackColor={trackColor}
                  textColor={ringTextColor}
                  displayText={`${packet.t_fingertip.toFixed(0)}°`}
                  tooltip="Distal-Dorsal Thermal Balance"
                />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-white/55 dark:border-white/12 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Fingertip (#1)</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                {packet.t_fingertip.toFixed(2)} °C
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Dorsal Hand (#2)</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100">
                {packet.t_dorsal.toFixed(2)} °C
              </dd>
            </div>
          </dl>
        </Card>

        {/* Card 3: Spectral Reflectance (TCS34725) */}
        <Card className="p-4 sm:p-5 hover:border-white/90 dark:hover:border-white/25 flex flex-col justify-between gap-3.5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  TCS34725 · Spectral
                </span>
              </div>
              <span className="font-mono text-[11px] whitespace-nowrap">White LED Sync</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  aria-label={`Calibrated nail-bed color swatch RGB ${packet.rgb_r}, ${packet.rgb_g}, ${packet.rgb_b}`}
                  className="w-8 h-8 rounded-lg ring-1 ring-slate-300/90 dark:ring-[#2E3446] shadow-xs shrink-0 transition-colors duration-300"
                  style={{ backgroundColor: rgbCss }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline flex-wrap gap-x-1">
                    <span className="text-[22px] 2xl:text-[26px] font-mono tabular-nums font-semibold text-slate-900 dark:text-white leading-none">
                      {(packet.pallor_index * 100).toFixed(0)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">% Pallor</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {packet.pallor_index > 0.6
                      ? 'Cyanosis / Blanching'
                      : packet.pallor_index > 0.35
                      ? 'Mild Pallor Shift'
                      : 'Normal Capillary Hue'}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <BiometricRingGauge
                  value={Math.round(packet.pallor_index * 100)}
                  size={48}
                  strokeWidth={7}
                  color={packet.pallor_index > 0.6 ? '#F43F5E' : packet.pallor_index > 0.35 ? '#E08E45' : '#00D18A'}
                  trackColor={trackColor}
                  textColor={ringTextColor}
                  displayText={`${Math.round(packet.pallor_index * 100)}%`}
                  tooltip="Pallor Reflectance Index"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/55 dark:border-white/12 flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
            <span>
              RGB ({packet.rgb_r}, {packet.rgb_g}, {packet.rgb_b})
            </span>
            <span>Clear {packet.rgb_clear}</span>
          </div>
        </Card>

        {/* Card 4: Motion & Environment (LIS3DH + Ambient) */}
        <Card className="p-4 sm:p-5 hover:border-white/90 dark:hover:border-white/25 flex flex-col justify-between gap-3.5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Signal01 className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  LIS3DH · Motion
                </span>
              </div>
              <span
                className={`font-semibold text-[11px] whitespace-nowrap ${
                  packet.high_motion_flag
                    ? 'text-amber-600 dark:text-[#E08E45]'
                    : 'text-emerald-600 dark:text-[#00D18A]'
                }`}
              >
                {packet.high_motion_flag ? 'Discarded (Artifact)' : 'Window Valid'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline flex-wrap gap-x-1">
                  <span className="text-[22px] 2xl:text-[26px] font-mono tabular-nums font-semibold text-slate-900 dark:text-white leading-none">
                    {packet.motion_score.toFixed(3)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">g² var</span>
                </div>
                <MiniSparkline
                  values={history.slice(-16).map((p) => p.packet.motion_score)}
                  color={packet.high_motion_flag ? '#E08E45' : '#00D18A'}
                  min={0}
                  max={0.5}
                  className="w-24 h-6"
                />
              </div>

              <div className="shrink-0">
                <BiometricRingGauge
                  value={packet.high_motion_flag ? 25 : 95}
                  size={48}
                  strokeWidth={7}
                  color={packet.high_motion_flag ? '#E08E45' : '#00D18A'}
                  trackColor={trackColor}
                  textColor={ringTextColor}
                  displayText={packet.high_motion_flag ? 'ART' : 'OK'}
                  tooltip="LIS3DH Window Stability Score"
                />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 pt-3 border-t border-white/55 dark:border-white/12 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Elevation</dt>
              <dd className="mt-0.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {packet.hand_elevation_deg.toFixed(0)}°
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Amb Temp</dt>
              <dd className="mt-0.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {packet.ambient_temp.toFixed(1)}°C
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Humidity</dt>
              <dd className="mt-0.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {packet.ambient_humidity.toFixed(0)}%
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      {/* Row 3: Synchronized Multi-Sensor Chart & Quick Symptom / Trigger Logger */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <Card className="xl:col-span-8 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Synchronized Microvascular Perfusion &amp; Thermal Gradient
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live dual-axis stream with threshold guides (PI {profile.piAlertThresholdPct}% · ΔT{' '}
              {profile.deltaTAlertThresholdC}°C) and hardware event-marker pins
            </p>
          </div>

          {/* React-Bootstrap Multi-Segment Zone Split Bar (matching video zone bar) */}
          <ZoneSplitBar
            segments={[
              { key: 'normal', label: 'Normal', pct: normalZonePct, color: '#10B981' },
              { key: 'cooling', label: 'Cooling', pct: coolingZonePct, color: '#F59E0B' },
              { key: 'vasospasm', label: 'Vasospasm', pct: spasmZonePct, color: '#F43F5E' },
            ]}
          />

          <SynchronizedChart
            points={history}
            piThresholdPct={profile.piAlertThresholdPct}
            deltaTThresholdC={profile.deltaTAlertThresholdC}
          />
        </Card>

        <Card className="xl:col-span-4 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Quick Symptom &amp; Trigger Logger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record subjective vasospasm triggers or annotate MCU button events
            </p>

            <form onSubmit={handleLogSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="log-trigger" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Trigger
                  </label>
                  <PrimeSelect
                    inputId="log-trigger"
                    ariaLabel="Trigger"
                    value={trigger}
                    options={[
                      'Cold Exposure',
                      'Emotional Stress',
                      'Vibration / Tool Use',
                      'Unknown',
                    ]}
                    onChange={(val) => setTrigger(val as EpisodeTrigger)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="log-stage" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Visual Stage
                  </label>
                  <PrimeSelect
                    inputId="log-stage"
                    ariaLabel="Visual Stage"
                    value={stage}
                    options={[
                      'White (Pallor)',
                      'Blue (Cyanosis)',
                      'Red (Rewarming)',
                      'Mixed Triphasic',
                    ]}
                    onChange={(val) => setStage(val as RaynaudsStage)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="log-severity" className="font-medium text-slate-700 dark:text-slate-300">
                    Symptom Severity (1–5)
                  </label>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {severity} / 5
                  </span>
                </div>
                <div className="px-1 pt-1">
                  <Slider
                    id="log-severity"
                    aria-label="Symptom Severity (1–5)"
                    min={1}
                    max={5}
                    step={1}
                    marks
                    value={severity}
                    onChange={(_, val) => setSeverity(Number(val) as 1 | 2 | 3 | 4 | 5)}
                    sx={{
                      color: '#1F75FE',
                      height: 6,
                      '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                        boxShadow: '0 0 0 4px rgba(31, 117, 254, 0.2)',
                      },
                      '& .MuiSlider-rail': {
                        opacity: 0.25,
                      },
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="log-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Clinical Notes
                </label>
                <Input
                  id="log-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Numbness, finger blanching, glove removal..."
                  className="mt-1"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log Symptom Event</span>
              </Button>
            </form>
          </div>

          {/* Recent Event Feed */}
          <div className="mt-5 pt-4 border-t border-white/55 dark:border-white/12">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              Recent Event Log ({symptomLogs.length})
            </h3>
            <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {symptomLogs.slice(0, 4).map((log) => (
                <li
                  key={log.id}
                  className="glass-well p-3 rounded-xl hover:border-white/85 dark:hover:border-white/25 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {log.source === 'hw_button' ? 'MCU Button Pin' : 'Manual Log'} · {log.trigger}
                    </span>
                    <PrimeStatusTag value={`PI ${log.piAtEvent.toFixed(2)}%`} tone="blue" />
                  </div>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400 line-clamp-1">{log.notes}</p>
                  {!log.annotated && (
                    <button
                      type="button"
                      onClick={() =>
                        onAnnotateSymptomLog(log.id, {
                          trigger,
                          stage,
                          severity,
                          annotated: true,
                          notes: notes.trim() || `Annotated: ${trigger} · ${stage}`,
                        })
                      }
                      className="mt-1.5 text-xs font-medium text-[#1F75FE] dark:text-[#60A5FA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F75FE]/40 rounded"
                    >
                      Apply Current Trigger &amp; Stage Annotation
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
