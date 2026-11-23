import React, { useId, useMemo, useState } from 'react';
import {
  Activity,
  Clock,
  Eye,
  SearchLg,
  ShieldTick,
  Thermometer02,
  XClose,
} from '@untitledui/icons';
import { Chip, Tooltip } from '@mui/material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { EpisodeTrigger, VasospasmEpisode } from '../../types/telemetry';
import { computeEpisodeSummary, filterEpisodes } from '../../utils/clinicalAnalytics';
import { glassColumnPt, glassDataTablePt } from '../../lib/primeTablePt';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { ZoneSplitBar } from '../ui/ZoneSplitBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface EpisodeHistoryViewProps {
  episodes: VasospasmEpisode[];
}

export function EpisodeHistoryView({ episodes }: EpisodeHistoryViewProps) {
  const [triggerFilter, setTriggerFilter] = useState<EpisodeTrigger | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState<VasospasmEpisode | null>(null);

  const summary = useMemo(() => computeEpisodeSummary(episodes), [episodes]);
  const filtered = useMemo(
    () => filterEpisodes(episodes, triggerFilter, searchQuery),
    [episodes, triggerFilter, searchQuery]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Episode History &amp; Recovery Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Longitudinal microvascular vasospasm events and thermal rewarming recovery curves
        </p>
      </div>

      {/* Summary KPI Strip (Screenshot 3 style colored icon badges + obsidian cards) */}
      <section aria-label="Episode Summary Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Episodes (7d / 30d)</p>
            <p className="mt-2 text-2xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {summary.episodesLast7d} <span className="text-slate-400 dark:text-slate-600 font-normal">/</span>{' '}
              {summary.episodesLast30d}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#1F75FE]/15 text-[#1F75FE] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" aria-hidden="true" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Average Episode Duration</p>
            <p className="mt-2 text-2xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {summary.avgDurationMin}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">min</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#E08E45]/15 text-[#E08E45] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mean Thermal Rewarming Recovery</p>
            <p className="mt-2 text-2xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {summary.avgRecoveryTimeMin}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">min to ΔT ≥ -1.0°C</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#00D18A]/15 text-[#00D18A] flex items-center justify-center shrink-0">
            <Thermometer02 className="w-4 h-4" aria-hidden="true" />
          </div>
        </Card>

        <Card className="p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hardware-Button Confirmed</p>
            <p className="mt-2 text-2xl font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
              {summary.hwConfirmedCount}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({summary.coldTriggeredPct}% Cold)
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldTick className="w-4 h-4" aria-hidden="true" />
          </div>
        </Card>
      </section>

      {/* Filter & Search Bar + Bootstrap Stacked Zone Split */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1 md:pb-0 -mx-1 px-1">
            <Tabs
              value={triggerFilter}
              onValueChange={(val) => setTriggerFilter(val as EpisodeTrigger | 'All')}
              className="w-max md:w-auto"
            >
              <TabsList>
                {(['All', 'Cold Exposure', 'Emotional Stress', 'Vibration / Tool Use'] as const).map((trig) => (
                  <TabsTrigger key={trig} value={trig} className="min-h-[36px] whitespace-nowrap">
                    {trig}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full md:w-72">
            <SearchLg
              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search episode history"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, stage, or clinical notes..."
              className="pl-10"
            />
          </div>
        </div>

        <ZoneSplitBar
          segments={[
            {
              key: 'mild',
              label: 'Mild',
              pct: (episodes.filter((e) => e.severity <= 2).length / Math.max(1, episodes.length)) * 100,
              color: '#10B981',
            },
            {
              key: 'moderate',
              label: 'Moderate',
              pct: (episodes.filter((e) => e.severity === 3).length / Math.max(1, episodes.length)) * 100,
              color: '#F59E0B',
            },
            {
              key: 'severe',
              label: 'Severe',
              pct: (episodes.filter((e) => e.severity >= 4).length / Math.max(1, episodes.length)) * 100,
              color: '#F43F5E',
            },
          ]}
        />
      </Card>

      {/* Episodes Data Table (Desktop) + Interactive Tap List (Mobile) */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No vasospasm episodes match your active filter criteria.
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-200/60 dark:divide-white/10">
              {filtered.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => setSelectedEpisode(ep)}
                  className="w-full min-h-[68px] p-4 flex items-center justify-between gap-3 text-left hover:bg-white/40 dark:hover:bg-white/[0.04] active:bg-white/60 dark:active:bg-white/[0.08] transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {ep.id}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {new Date(ep.startedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {ep.trigger} · {ep.stage}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
                      <span className="text-rose-600 dark:text-rose-400">PI {ep.nadirPiPct.toFixed(2)}%</span>
                      <span className="text-amber-600 dark:text-[#E08E45]">ΔT {ep.nadirDeltaTC.toFixed(1)}°C</span>
                      <span className="text-slate-500 dark:text-slate-400">{ep.durationMin}m</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        ep.severity >= 4
                          ? 'text-rose-500'
                          : ep.severity >= 3
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      Sev {ep.severity}/5
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Replay</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block">
              <DataTable
                value={filtered}
                dataKey="id"
                unstyled
                pt={glassDataTablePt}
              >
            <Column
              field="id"
              header="Episode ID"
              pt={glassColumnPt('left')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {ep.id}
                </span>
              )}
            />
            <Column
              header="Timestamp"
              pt={glassColumnPt('left')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {new Date(ep.startedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            />
            <Column
              header="Trigger & Stage"
              pt={glassColumnPt('left')}
              body={(ep: VasospasmEpisode) => (
                <div className="min-w-36 text-slate-700 dark:text-slate-200">
                  <div className="font-medium">{ep.trigger}</div>
                  <div className="text-slate-500 dark:text-slate-400">{ep.stage}</div>
                </div>
              )}
            />
            <Column
              header="Duration"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {ep.durationMin} min
                </span>
              )}
            />
            <Column
              header="Rewarming"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {ep.recoveryTimeMin} min
                </span>
              )}
            />
            <Column
              header="Nadir PI"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                  {ep.nadirPiPct.toFixed(2)}%
                </span>
              )}
            />
            <Column
              header="Nadir ΔT"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <span className="font-mono tabular-nums text-amber-600 dark:text-[#E08E45] font-medium">
                  {ep.nadirDeltaTC.toFixed(1)}°C
                </span>
              )}
            />
            <Column
              header="Severity"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <Tooltip title={`Severity Rating ${ep.severity} of 5`} arrow>
                  <Chip
                    size="small"
                    label={`${ep.severity} / 5`}
                    sx={{
                      height: 22,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor:
                        ep.severity >= 4
                          ? 'rgba(244, 63, 94, 0.14)'
                          : ep.severity >= 3
                          ? 'rgba(224, 142, 69, 0.14)'
                          : 'rgba(0, 209, 138, 0.14)',
                      color: ep.severity >= 4 ? '#FB7185' : ep.severity >= 3 ? '#F59E0B' : '#00D18A',
                    }}
                  />
                </Tooltip>
              )}
            />
            <Column
              header="Replay"
              pt={glassColumnPt('right')}
              body={(ep: VasospasmEpisode) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEpisode(ep)}
                  aria-label={`Replay episode ${ep.id}`}
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Replay Curve</span>
                </Button>
              )}
            />
              </DataTable>
            </div>
          </>
        )}
      </Card>

      {/* Episode Replay Modal (shadcn Radix Dialog) */}
      <Dialog open={Boolean(selectedEpisode)} onOpenChange={(open) => !open && setSelectedEpisode(null)}>
        <DialogContent aria-labelledby="replay-modal-title">
          {selectedEpisode && (
            <div className="space-y-5">
              <DialogHeader>
                <div>
                  <DialogTitle id="replay-modal-title">
                    Episode Replay · {selectedEpisode.id}
                  </DialogTitle>
                  <DialogDescription>
                    {new Date(selectedEpisode.startedAt).toLocaleString()} · {selectedEpisode.trigger} ·{' '}
                    {selectedEpisode.stage}
                  </DialogDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedEpisode(null)}
                  aria-label="Close episode replay modal"
                >
                  <XClose className="w-4 h-4" />
                </Button>
              </DialogHeader>

              {/* Multi-Sensor Replay Curve (PI, ΔT, Pallor/RGB) */}
              <EpisodeReplayCurve episode={selectedEpisode} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-white/55 dark:border-white/12">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Nadir PI</span>
                  <p className="font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                    {selectedEpisode.nadirPiPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Nadir ΔT</span>
                  <p className="font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {selectedEpisode.nadirDeltaTC.toFixed(1)} °C
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Rewarming Recovery</span>
                  <p className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedEpisode.recoveryTimeMin} min
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Peak Pallor Shift</span>
                  <p className="font-mono tabular-nums font-semibold text-rose-500 dark:text-rose-400 mt-0.5">
                    {(selectedEpisode.peakPallorIndex * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="glass-well text-xs text-slate-600 dark:text-slate-300 p-3.5 rounded-xl">
                <span className="font-semibold text-slate-900 dark:text-white">Clinical Context: </span>
                {selectedEpisode.notes}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toSmoothCurve(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i === 0 ? i : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function EpisodeReplayCurve({ episode }: { episode: VasospasmEpisode }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const uid = useId();
  const piGradId = `repPiGrad-${uid}`;
  const pallorGradId = `repPalGrad-${uid}`;
  const glowId = `repGlow-${uid}`;

  const width = 660;
  const height = 228;
  const padL = 42;
  const padR = 44;
  const padT = 18;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const samples = episode.samples;

  const toX = (idx: number) =>
    samples.length <= 1 ? padL : padL + (idx / (samples.length - 1)) * plotW;
  const toYPi = (pi: number) => padT + plotH - (Math.min(3.5, Math.max(0, pi)) / 3.5) * plotH;
  const toYDt = (dt: number) =>
    padT + plotH - ((Math.min(0, Math.max(-13, dt)) + 13) / 13) * plotH;
  const toYPallor = (p: number) => padT + plotH - Math.min(1, Math.max(0, p)) * plotH;

  const piCoords = samples.map((s, i) => ({ x: toX(i), y: toYPi(s.perfusion_index) }));
  const dtCoords = samples.map((s, i) => ({ x: toX(i), y: toYDt(s.delta_t) }));
  const pallorCoords = samples.map((s, i) => ({ x: toX(i), y: toYPallor(s.pallor_index) }));

  const piPath = toSmoothCurve(piCoords);
  const piArea =
    samples.length > 1
      ? `${piPath} L ${toX(samples.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : '';
  const dtPath = toSmoothCurve(dtCoords);
  const pallorPath = toSmoothCurve(pallorCoords);
  const pallorArea =
    samples.length > 1
      ? `${pallorPath} L ${toX(samples.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
      : '';

  const hovered = hoverIdx !== null && samples[hoverIdx] ? samples[hoverIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-3.5 h-1 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_8px_rgba(56,189,248,0.6)]" aria-hidden="true" /> Perfusion Index (%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-[#F59E0B] inline-block" aria-hidden="true" /> ΔT (°C)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-3.5 h-1 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]" aria-hidden="true" /> Spectral Pallor Index
          </span>
        </div>

        {hovered && (
          <div className="font-mono tabular-nums text-slate-900 dark:text-white bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl px-2.5 py-1 rounded-xl border border-white/70 dark:border-white/15 shadow-md">
            +{hovered.minuteOffset}m · PI {hovered.perfusion_index.toFixed(2)}% · ΔT {hovered.delta_t.toFixed(1)}°C
          </div>
        )}
      </div>

      <div className="glass-well rounded-2xl p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 cursor-crosshair select-none overflow-visible touch-pan-y"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            if (samples.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padL) / plotW));
            setHoverIdx(Math.round(norm * (samples.length - 1)));
          }}
          onTouchStart={(e) => {
            if (samples.length === 0 || !e.touches[0]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padL) / plotW));
            setHoverIdx(Math.round(norm * (samples.length - 1)));
          }}
          onTouchMove={(e) => {
            if (samples.length === 0 || !e.touches[0]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padL) / plotW));
            setHoverIdx(Math.round(norm * (samples.length - 1)));
          }}
          onTouchEnd={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={piGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={pallorGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
            <filter id={glowId} x="-15%" y="-25%" width="130%" height="150%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={`vx-${f}`}
              x1={padL + f * plotW}
              y1={padT}
              x2={padL + f * plotW}
              y2={padT + plotH}
              className="stroke-slate-300/45 dark:stroke-white/[0.05]"
              strokeWidth="1"
            />
          ))}

          {[0, 0.5, 1].map((f) => {
            const y = padT + f * plotH;
            const piVal = ((1 - f) * 3.5).toFixed(1);
            const dtVal = (-(f * 13)).toFixed(0);
            return (
              <g key={f}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  className="stroke-slate-300/60 dark:stroke-white/[0.08]"
                />
                <text x={padL - 7} y={y + 3} textAnchor="end" className="fill-sky-600 dark:fill-sky-400/80 text-[10px] font-mono">
                  {piVal}%
                </text>
                <text x={width - padR + 7} y={y + 3} textAnchor="start" className="fill-amber-600 dark:fill-amber-400/80 text-[10px] font-mono">
                  {dtVal}°
                </text>
              </g>
            );
          })}

          {samples.length > 1 && (
            <>
              <path d={pallorArea} fill={`url(#${pallorGradId})`} />
              <path d={piArea} fill={`url(#${piGradId})`} />
              <path
                d={dtPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.1"
                strokeDasharray="5 3"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
              />
              <path
                d={pallorPath}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.0"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
              />
              <path
                d={piPath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.6"
                strokeLinecap="round"
                filter={`url(#${glowId})`}
              />
            </>
          )}

          {hoverIdx !== null && samples[hoverIdx] && (
            <g>
              <line
                x1={toX(hoverIdx)}
                y1={padT}
                x2={toX(hoverIdx)}
                y2={padT + plotH}
                stroke="#94A3B8"
                strokeOpacity="0.65"
                strokeDasharray="3 3"
              />
              <circle cx={toX(hoverIdx)} cy={toYPi(samples[hoverIdx].perfusion_index)} r="4.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={toX(hoverIdx)} cy={toYDt(samples[hoverIdx].delta_t)} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.4" />
              <circle cx={toX(hoverIdx)} cy={toYPallor(samples[hoverIdx].pallor_index)} r="4" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.4" />
            </g>
          )}

          <text x={padL} y={height - 6} className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
            0 min (Onset)
          </text>
          <text x={width - padR} y={height - 6} textAnchor="end" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono">
            {episode.durationMin} min (Rewarmed)
          </text>
        </svg>
      </div>

      {/* Nail-bed RGB Progression Strip */}
      <div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          TCS34725 Calibrated Nail-Bed RGB Progression (Onset → Nadir → Rewarming)
        </div>
        <div className="flex h-5 rounded-xl overflow-hidden border border-white/60 dark:border-white/15 shadow-inner">
          {samples.map((s, idx) => (
            <div
              key={idx}
              title={`${s.minuteOffset}m: RGB(${s.rgb_r}, ${s.rgb_g}, ${s.rgb_b})`}
              className="flex-1"
              style={{ backgroundColor: `rgb(${s.rgb_r}, ${s.rgb_g}, ${s.rgb_b})` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
