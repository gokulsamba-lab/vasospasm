import React, { useMemo } from 'react';
import { Activity, Clock, Printer, ShieldTick, Thermometer02 } from '@untitledui/icons';
import { LinearProgress, Tooltip } from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { PatientProfile, SymptomLog, VasospasmEpisode } from '../../types/telemetry';
import {
  computeEpisodeSummary,
  computeSymptomPerfusionCorrelation,
} from '../../utils/clinicalAnalytics';
import { glassColumnPt, glassDataTablePt } from '../../lib/primeTablePt';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { PrimeStatusTag } from '../ui/PrimeStatusTag';
import { ZoneSplitBar } from '../ui/ZoneSplitBar';

interface ClinicalReportViewProps {
  profile: PatientProfile;
  episodes: VasospasmEpisode[];
  symptomLogs: SymptomLog[];
}

export function ClinicalReportView({
  profile,
  episodes,
  symptomLogs,
}: ClinicalReportViewProps) {
  const summary = useMemo(() => computeEpisodeSummary(episodes), [episodes]);
  const correlation = useMemo(
    () => computeSymptomPerfusionCorrelation(symptomLogs, profile.piAlertThresholdPct),
    [symptomLogs, profile.piAlertThresholdPct]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Clinical Report Generator
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Formatted rheumatology consultation summary combining objective vascular telemetry and patient logs
          </p>
        </div>

        <Button type="button" size="lg" onClick={handlePrint} className="shrink-0">
          <Printer className="w-4 h-4" aria-hidden="true" />
          <span>Print / Save as PDF</span>
        </Button>
      </div>

      {/* Printable Rheumatology Report Sheet */}
      <Card className="p-5 sm:p-10 print-only-clean space-y-8 max-w-4xl">
        {/* Report Header */}
        <header className="border-b border-white/55 dark:border-white/12 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-mono text-[#1F75FE]">
                VasoSense Clinical · FRDM-MCXN236 Microvascular Telemetry Summary
              </p>
              <Badge variant="blue" className="no-print">Clinical Summary</Badge>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Rheumatology Consultation Report — Raynaud&apos;s Phenomenon
            </h2>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 sm:text-right">
            <div>Generated: {new Date().toLocaleDateString()}</div>
            <div>Device ID: {profile.boundDeviceMacOrSerial}</div>
          </div>
        </header>

        {/* Patient Clinical Profile Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Patient Name &amp; ID</span>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {profile.fullName} ({profile.patientId})
            </p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Classification</span>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{profile.raynaudsType}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Monitored / Dominant Hand</span>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {profile.monitoredHand} / {profile.dominantHand}
            </p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Resting Calibrated Baseline</span>
            <p className="mt-1 font-mono tabular-nums font-semibold text-[#00E599]">
              PI {profile.calibration.restingPiPct.toFixed(2)}% · ΔT {profile.calibration.restingDeltaTC.toFixed(2)}°C
            </p>
          </div>
        </section>

        {/* Objective Episode Frequency & Thermal Recovery Summary */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-white/55 dark:border-white/12 pb-2">
            01. Episode Frequency &amp; Thermal Rewarming Recovery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="glass-well p-4 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400">7-Day Episode Count</span>
                <p className="mt-1.5 text-xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {summary.episodesLast7d}
                </p>
              </div>
              <span className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="glass-well p-4 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400">30-Day Episode Count</span>
                <p className="mt-1.5 text-xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {summary.episodesLast30d}
                </p>
              </div>
              <span className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-400/25 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldTick className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="glass-well p-4 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Mean Duration</span>
                <p className="mt-1.5 text-xl font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                  {summary.avgDurationMin} min
                </p>
              </div>
              <span className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="glass-well p-4 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Mean Recovery Time</span>
                <p className="mt-1.5 text-xl font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary.avgRecoveryTimeMin} min
                </p>
              </div>
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Thermometer02 className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        </section>

        {/* Symptom-to-Objective Perfusion Correlation */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-white/55 dark:border-white/12 pb-2">
            02. Symptom-to-Perfusion Concordance Analysis
          </h3>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            Out of <span className="font-mono tabular-nums font-semibold">{correlation.totalMarked}</span> patient-marked
            symptom events (physical MCU button presses and manual journal entries),{' '}
            <span className="font-mono tabular-nums font-semibold">{correlation.objectiveDropConfirmed}</span> (
            <span className="font-mono tabular-nums font-semibold">{correlation.concordancePct}%</span> concordance)
            coincided with an objective MAX30102 Perfusion Index drop below{' '}
            <span className="font-mono tabular-nums">{profile.piAlertThresholdPct}%</span> or a distal-dorsal gradient ΔT
            below <span className="font-mono tabular-nums">-3.0°C</span>. Mean PI at symptom onset was{' '}
            <span className="font-mono tabular-nums font-semibold">{correlation.meanPiAtSymptom.toFixed(2)}%</span> with
            mean thermal gradient{' '}
            <span className="font-mono tabular-nums font-semibold">{correlation.meanDeltaTAtSymptom.toFixed(2)}°C</span>.
          </p>

          <div className="no-print space-y-2 pt-1">
            <Tooltip title={`Concordance Rate: ${correlation.concordancePct}%`} arrow>
              <div>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, correlation.concordancePct))}
                  sx={{
                    height: 7,
                    borderRadius: 999,
                    bgcolor: 'rgba(148,163,184,0.16)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      bgcolor: '#00E599',
                    },
                  }}
                />
              </div>
            </Tooltip>
            <ZoneSplitBar
              segments={[
                {
                  key: 'confirmed',
                  label: 'Confirmed',
                  pct: correlation.concordancePct,
                  color: '#00E599',
                },
                {
                  key: 'unconfirmed',
                  label: 'Unconfirmed',
                  pct: Math.max(0, 100 - correlation.concordancePct),
                  color: '#E08E45',
                },
              ]}
            />
          </div>
        </section>

        {/* Recent Documented Episodes Table */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-white/55 dark:border-white/12 pb-2">
            03. Documented Vasospasm Episodes (Recent)
          </h3>
          <div className="glass-well rounded-2xl overflow-hidden">
            <div className="md:hidden print:hidden divide-y divide-slate-200/60 dark:divide-white/10">
              {episodes.slice(0, 6).map((ep) => (
                <div key={ep.id} className="p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {new Date(ep.startedAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{ep.stage}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{ep.trigger}</div>
                  <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                    <span className="text-[#0095FF]">PI {ep.nadirPiPct.toFixed(2)}%</span>
                    <span className="text-[#E08E45]">ΔT {ep.nadirDeltaTC.toFixed(1)}°C</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {ep.durationMin}m · Rec {ep.recoveryTimeMin}m
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block print:block">
              <DataTable
                value={episodes.slice(0, 6)}
                dataKey="id"
                unstyled
                pt={glassDataTablePt}
              >
                <Column
                  header="Date"
                  pt={glassColumnPt('left')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {new Date(ep.startedAt).toLocaleDateString()}
                    </span>
                  )}
                />
                <Column
                  header="Trigger"
                  pt={glassColumnPt('left')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="text-slate-900 dark:text-slate-100">{ep.trigger}</span>
                  )}
                />
                <Column
                  header="Stage"
                  pt={glassColumnPt('left')}
                  body={(ep: VasospasmEpisode) => (
                    <PrimeStatusTag
                      value={ep.stage}
                      tone={
                        ep.stage === 'Red (Rewarming)'
                          ? 'rose'
                          : ep.stage === 'Blue (Cyanosis)'
                          ? 'blue'
                          : ep.stage === 'Mixed Triphasic'
                          ? 'amber'
                          : 'slate'
                      }
                    />
                  )}
                />
                <Column
                  header="Duration"
                  pt={glassColumnPt('right')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {ep.durationMin}m
                    </span>
                  )}
                />
                <Column
                  header="Recovery"
                  pt={glassColumnPt('right')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {ep.recoveryTimeMin}m
                    </span>
                  )}
                />
                <Column
                  header="Nadir PI"
                  pt={glassColumnPt('right')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="font-mono tabular-nums text-[#0095FF]">
                      {ep.nadirPiPct.toFixed(2)}%
                    </span>
                  )}
                />
                <Column
                  header="Nadir ΔT"
                  pt={glassColumnPt('right')}
                  body={(ep: VasospasmEpisode) => (
                    <span className="font-mono tabular-nums text-[#E08E45]">
                      {ep.nadirDeltaTC.toFixed(1)}°C
                    </span>
                  )}
                />
              </DataTable>
            </div>
          </div>
        </section>
      </Card>
    </div>
  );
}
