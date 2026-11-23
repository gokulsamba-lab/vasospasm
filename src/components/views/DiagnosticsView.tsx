import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Play, RefreshCcw01, Sliders04 } from '@untitledui/icons';
import { Chip, LinearProgress, Tooltip } from '@mui/material';
import type { CalibrationBaseline, PatientProfile, TelemetryPacket } from '../../types/telemetry';
import { computeCalibrationBaseline } from '../../utils/clinicalAnalytics';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PrimeStatusTag } from '../ui/PrimeStatusTag';
import { BiometricRingGauge } from '../ui/BiometricRingGauge';

interface DiagnosticsViewProps {
  packet: TelemetryPacket;
  profile: PatientProfile;
  onSaveCalibration: (cal: CalibrationBaseline) => void;
}

type SensorNodeId = 'finger_pad' | 'finger_side' | 'nail_bed' | 'dorsal_hand' | 'wrist_mcu';

export function DiagnosticsView({ packet, profile, onSaveCalibration }: DiagnosticsViewProps) {
  const [selectedNode, setSelectedNode] = useState<SensorNodeId>('finger_pad');
  const [calState, setCalState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const capturedPacketsRef = useRef<TelemetryPacket[]>([]);
  const latestPacketRef = useRef<TelemetryPacket>(packet);

  useEffect(() => {
    latestPacketRef.current = packet;
  }, [packet]);

  useEffect(() => {
    if (calState !== 'running') return;
    const timer = window.setInterval(() => {
      capturedPacketsRef.current.push(latestPacketRef.current);
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (next >= 30) {
          window.clearInterval(timer);
          const cal = computeCalibrationBaseline(capturedPacketsRef.current);
          onSaveCalibration(cal);
          setCalState('complete');
          return 30;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [calState, onSaveCalibration]);

  const startCalibration = () => {
    capturedPacketsRef.current = [latestPacketRef.current];
    setElapsedSec(0);
    setCalState('running');
  };

  const completeCalibrationNow = () => {
    if (capturedPacketsRef.current.length === 0) {
      capturedPacketsRef.current.push(latestPacketRef.current);
    }
    const cal = computeCalibrationBaseline(capturedPacketsRef.current);
    onSaveCalibration(cal);
    setElapsedSec(30);
    setCalState('complete');
  };

  const sensorNodes: Array<{
    id: SensorNodeId;
    title: string;
    location: string;
    hardware: string;
    healthy: boolean;
    statusText: string;
    telemetrySummary: string;
    coords: { x: number; y: number };
  }> = [
    {
      id: 'finger_pad',
      title: 'Finger Pad Optical Array',
      location: 'Volar Distal Phalanx (Index)',
      hardware: 'MAX30102 Reflective PPG + Fixed-Pressure Strap',
      healthy: packet.ppg_snr >= 12 && packet.ppg_dc > 2000,
      statusText: packet.ppg_snr >= 12 ? 'Contact Optimal' : 'Low SNR / Pressure Check',
      telemetrySummary: `PI ${packet.perfusion_index.toFixed(2)}% · AC ${packet.ppg_ac.toFixed(1)} · DC ${packet.ppg_dc.toFixed(0)} · SNR ${packet.ppg_snr.toFixed(1)} dB`,
      coords: { x: 146, y: 78 },
    },
    {
      id: 'finger_side',
      title: 'Distal Thermal Probe',
      location: 'Lateral Finger Pad',
      hardware: 'TMP117 #1 High-Accuracy (±0.1°C) I2C',
      healthy: packet.t_fingertip > 10 && packet.t_fingertip < 42,
      statusText: 'Thermal Lock Nominal',
      telemetrySummary: `T_fingertip ${packet.t_fingertip.toFixed(2)} °C · dT/dt ${packet.cooling_rate.toFixed(2)} °C/min`,
      coords: { x: 170, y: 92 },
    },
    {
      id: 'nail_bed',
      title: 'Nail-Bed Spectral Sensor',
      location: 'Dorsal Nail Plate',
      hardware: 'TCS34725 + Opaque Housing & Time-Multiplexed White LED',
      healthy: packet.rgb_clear > 400,
      statusText: 'LED Sync & Ambient Shield OK',
      telemetrySummary: `RGB (${packet.rgb_r}, ${packet.rgb_g}, ${packet.rgb_b}) · Clear ${packet.rgb_clear} · Pallor ${(packet.pallor_index * 100).toFixed(0)}%`,
      coords: { x: 146, y: 52 },
    },
    {
      id: 'dorsal_hand',
      title: 'Dorsal Reference Probe',
      location: 'Central Dorsal Metacarpal',
      hardware: 'TMP117 #2 Thermal Reference',
      healthy: packet.t_dorsal > 18 && packet.t_dorsal < 40,
      statusText: 'Reference Differential Active',
      telemetrySummary: `T_dorsal ${packet.t_dorsal.toFixed(2)} °C · ΔT ${packet.delta_t.toFixed(2)} °C`,
      coords: { x: 158, y: 196 },
    },
    {
      id: 'wrist_mcu',
      title: 'Wrist Telemetry Controller',
      location: 'Dorsal Distal Forearm / Wrist',
      hardware: 'FRDM-MCXN236 (Cortex-M33) · LIS3DH · RTC · microSD · BLE',
      healthy: !packet.high_motion_flag && packet.battery_pct > 15,
      statusText: packet.high_motion_flag ? 'Motion Gate Active (Discard)' : 'MCU, RTC & Storage Nominal',
      telemetrySummary: `Motion ${packet.motion_score.toFixed(3)} · Batt ${packet.battery_pct}% · SD ${packet.sd_free_mb.toFixed(0)} MB free`,
      coords: { x: 158, y: 295 },
    },
  ];

  const activeNode = sensorNodes.find((n) => n.id === selectedNode) ?? sensorNodes[0];
  const calPct = Math.round((elapsedSec / 30) * 100);
  const allHealthy = sensorNodes.every((n) => n.healthy);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Hardware Diagnostics &amp; Baseline Calibration
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Live sensor placement verification across all 5 anatomical locations on {profile.monitoredHand} hand &amp; wrist
          </p>
        </div>

        <Badge variant={allHealthy ? 'mint' : 'amber'}>
          {allHealthy ? '5 / 5 Nodes Nominal' : 'Sensor Check Required'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Anatomical Schematic Card (HealthFlow frosted glass diagnostic schematic) */}
        <Card className="xl:col-span-7 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 flex flex-col items-center rounded-2xl p-3 glass-well">
            <svg
              viewBox="0 0 320 350"
              className="w-full max-w-68 h-auto"
              role="img"
              aria-label="Anatomical hand and wrist sensor placement schematic"
            >
              {/* Stylized Anatomical Hand & Wrist Silhouette */}
              <path
                d="M118 335 L114 250 C96 238 78 212 68 186 C62 170 76 160 88 172 L106 196 L104 108 C104 92 124 92 126 108 L130 165 L134 52 C134 36 158 36 158 52 L158 158 L168 62 C168 46 190 46 190 62 L188 164 L198 86 C198 72 218 74 218 88 L212 182 L222 132 C224 118 242 122 240 136 L224 228 C218 250 206 266 202 278 L200 335 Z"
                className="fill-white/60 dark:fill-white/[0.06] stroke-slate-300/80 dark:stroke-white/20"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Wrist Module Band */}
              <rect
                x="110"
                y="272"
                width="96"
                height="44"
                rx="8"
                className="fill-slate-200/80 dark:fill-[#222837] stroke-slate-400 dark:stroke-[#3A4258]"
                strokeWidth="1.5"
              />

              {/* Interactive Sensor Nodes */}
              {sensorNodes.map((node) => {
                const isSelected = node.id === selectedNode;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <circle
                      cx={node.coords.x}
                      cy={node.coords.y}
                      r={isSelected ? 14 : 10}
                      fill={node.healthy ? 'rgba(0, 229, 153, 0.22)' : 'rgba(224, 142, 69, 0.25)'}
                      stroke={node.healthy ? '#00E599' : '#E08E45'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <circle
                      cx={node.coords.x}
                      cy={node.coords.y}
                      r="4.5"
                      fill={node.healthy ? '#00E599' : '#E08E45'}
                    />
                  </g>
                );
              })}
            </svg>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Click any anatomical node or select from the list to inspect live diagnostics
            </p>
          </div>

          <div className="md:col-span-6 space-y-2.5">
            {sensorNodes.map((node) => {
              const active = node.id === selectedNode;
              return (
                <Tooltip key={node.id} title={node.statusText} placement="top" arrow>
                  <button
                    type="button"
                    onClick={() => setSelectedNode(node.id)}
                    className={`w-full min-h-[48px] text-left p-3.5 rounded-xl border transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 backdrop-blur-md ${
                      active
                        ? 'border-sky-400/70 bg-sky-500/12 dark:bg-sky-400/15 ring-1 ring-sky-400/35 shadow-[0_0_24px_-6px_rgba(56,189,248,0.45)]'
                        : 'border-white/55 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] hover:bg-white/65 dark:hover:bg-white/[0.07] hover:border-white/85 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{node.title}</span>
                      <Chip
                        size="small"
                        label={node.healthy ? 'Healthy' : 'Check'}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: node.healthy ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.16)',
                          color: node.healthy ? '#10B981' : '#F59E0B',
                        }}
                      />
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{node.location}</div>
                  </button>
                </Tooltip>
              );
            })}

            <div className="glass-well mt-3 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{activeNode.hardware}</span>
                <PrimeStatusTag
                  value={activeNode.healthy ? 'Healthy' : 'Check'}
                  tone={activeNode.healthy ? 'mint' : 'amber'}
                />
              </div>
              <div className="text-slate-600 dark:text-slate-300">{activeNode.statusText}</div>
              <div className="font-mono tabular-nums text-sky-600 dark:text-sky-400 pt-0.5">
                {activeNode.telemetrySummary}
              </div>
            </div>
          </div>
        </Card>

        {/* 30-Second Resting Baseline Calibration Wizard */}
        <Card className="xl:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#1F75FE]">
                  <span className="w-7 h-7 rounded-lg bg-[#1F75FE]/15 text-[#1F75FE] flex items-center justify-center shrink-0">
                    <Sliders04 className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold">Personalized Threshold Calibration</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  30-Second Resting Baseline Wizard
                </h2>
              </div>

              <BiometricRingGauge
                value={calState === 'complete' ? 100 : calPct}
                size={60}
                strokeWidth={8}
                color={calState === 'complete' ? '#00D18A' : '#1F75FE'}
                trackColor="rgba(148, 163, 184, 0.22)"
                textColor="currentColor"
                displayText={`${elapsedSec}s`}
                tooltip="30-Second Calibration Progress"
              />
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Keep the monitored hand warm and motionless at heart level for 30 seconds. Captures resting MAX30102
              Perfusion Index, TMP117 ΔT offset, and TCS34725 capillary baseline RGB to personalize vasospasm alerts.
            </p>

            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1.5 text-slate-700 dark:text-slate-300">
                <span>
                  {calState === 'running'
                    ? 'Capturing Resting Windows...'
                    : calState === 'complete'
                    ? 'Baseline Calibration Saved'
                    : 'Ready to Calibrate'}
                </span>
                <span>{elapsedSec}s / 30s</span>
              </div>
              <LinearProgress
                variant="determinate"
                value={calPct}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: 'rgba(148,163,184,0.18)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    bgcolor: calState === 'complete' ? '#00D18A' : '#1F75FE',
                  },
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button
                type="button"
                onClick={startCalibration}
                disabled={calState === 'running'}
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{calState === 'running' ? 'Capturing...' : 'Start 30s Baseline Capture'}</span>
              </Button>

              {calState === 'running' && (
                <Button type="button" variant="outline" onClick={completeCalibrationNow}>
                  <CheckCircle className="w-3.5 h-3.5 text-[#00D18A]" aria-hidden="true" />
                  <span>Finalize Captured Samples</span>
                </Button>
              )}

              {calState === 'complete' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCalState('idle');
                    setElapsedSec(0);
                  }}
                >
                  <RefreshCcw01 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Active Stored Calibration Readout */}
          <div className="pt-4 border-t border-white/55 dark:border-white/12 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">Active Calibrated Baseline</span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {new Date(profile.calibration.calibratedAt).toLocaleDateString()}
              </span>
            </div>
            <dl className="grid grid-cols-3 gap-3 font-mono tabular-nums">
              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-sans">Resting PI</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[#0095FF]">
                  {profile.calibration.restingPiPct.toFixed(2)}%
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-sans">Resting ΔT</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[#00D18A]">
                  {profile.calibration.restingDeltaTC.toFixed(2)} °C
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-sans">Baseline RGB</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold">
                  <span
                    className="w-3.5 h-3.5 rounded-xs ring-1 ring-slate-300 dark:ring-[#2E3446] inline-block shrink-0"
                    style={{
                      backgroundColor: `rgb(${profile.calibration.baselineRgb.r}, ${profile.calibration.baselineRgb.g}, ${profile.calibration.baselineRgb.b})`,
                    }}
                  />
                  <span>
                    {profile.calibration.baselineRgb.r},{profile.calibration.baselineRgb.g},
                    {profile.calibration.baselineRgb.b}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </div>
  );
}
