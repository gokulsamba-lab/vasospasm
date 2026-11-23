import React, { useId, useState } from 'react';
import type { TelemetryPacket } from '../types/telemetry';

export interface ChartPoint {
  timeLabel: string;
  packet: TelemetryPacket;
}

interface SynchronizedChartProps {
  points: ChartPoint[];
  piThresholdPct: number;
  deltaTThresholdC: number;
}

function toSmoothPath(coords: Array<{ x: number; y: number }>): string {
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

export function SynchronizedChart({
  points,
  piThresholdPct,
  deltaTThresholdC,
}: SynchronizedChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const uid = useId();
  const piGradId = `piGrad-${uid}`;
  const dtGradId = `dtGrad-${uid}`;
  const piGlowId = `piGlow-${uid}`;
  const dtGlowId = `dtGlow-${uid}`;

  const width = 760;
  const height = 264;
  const padLeft = 46;
  const padRight = 50;
  const padTop = 20;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const piMax = 4.5;
  const piMin = 0;
  const dtMax = 1.0;
  const dtMin = -13.0;

  const toX = (idx: number) =>
    points.length <= 1 ? padLeft : padLeft + (idx / (points.length - 1)) * plotW;

  const toYPi = (pi: number) => {
    const clamped = Math.min(piMax, Math.max(piMin, pi));
    return padTop + plotH - ((clamped - piMin) / (piMax - piMin)) * plotH;
  };

  const toYDt = (dt: number) => {
    const clamped = Math.min(dtMax, Math.max(dtMin, dt));
    return padTop + plotH - ((clamped - dtMin) / (dtMax - dtMin)) * plotH;
  };

  const piCoords = points.map((pt, i) => ({
    x: toX(i),
    y: toYPi(pt.packet.perfusion_index),
  }));
  const dtCoords = points.map((pt, i) => ({
    x: toX(i),
    y: toYDt(pt.packet.delta_t),
  }));

  const piPath = toSmoothPath(piCoords);
  const piAreaPath =
    points.length > 1
      ? `${piPath} L ${toX(points.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const dtPath = toSmoothPath(dtCoords);
  const dtAreaPath =
    points.length > 1
      ? `${dtPath} L ${toX(points.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const hovered = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;
  const lastIdx = points.length - 1;
  const lastPoint = lastIdx >= 0 ? points[lastIdx] : null;

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-3.5 h-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] inline-block shadow-[0_0_8px_rgba(56,189,248,0.65)]" aria-hidden="true" />
            <span>Perfusion Index (%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-[#F59E0B] inline-block" aria-hidden="true" />
            <span>Thermal Gradient ΔT (°C)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 bg-rose-500/25 border border-rose-400/50 inline-block rounded-xs" aria-hidden="true" />
            <span>Active Vasospasm Band</span>
          </span>
        </div>

        {hovered && (
          <div className="font-mono tabular-nums text-slate-900 dark:text-white bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl px-3 py-1 rounded-xl border border-white/70 dark:border-white/15 shadow-lg">
            {hovered.timeLabel} · PI {hovered.packet.perfusion_index.toFixed(2)}% · ΔT{' '}
            {hovered.packet.delta_t.toFixed(2)}°C
          </div>
        )}
      </div>

      <div className="glass-well rounded-2xl p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 sm:h-64 cursor-crosshair select-none overflow-visible touch-pan-y"
          role="img"
          aria-label="Synchronized Perfusion Index and Thermal Gradient time-series chart"
          onMouseLeave={() => setHoverIdx(null)}
          onMouseMove={(e) => {
            if (points.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padLeft) / plotW));
            setHoverIdx(Math.round(norm * (points.length - 1)));
          }}
          onTouchStart={(e) => {
            if (points.length === 0 || !e.touches[0]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padLeft) / plotW));
            setHoverIdx(Math.round(norm * (points.length - 1)));
          }}
          onTouchMove={(e) => {
            if (points.length === 0 || !e.touches[0]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.touches[0].clientX - rect.left) / rect.width) * width;
            const norm = Math.min(1, Math.max(0, (relX - padLeft) / plotW));
            setHoverIdx(Math.round(norm * (points.length - 1)));
          }}
          onTouchEnd={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={piGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.42" />
              <stop offset="55%" stopColor="#2563EB" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={dtGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
            <filter id={piGlowId} x="-15%" y="-25%" width="130%" height="150%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={dtGlowId} x="-15%" y="-25%" width="130%" height="150%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Vertical subtle coordinate guides */}
          {[0.2, 0.4, 0.6, 0.8].map((frac) => {
            const x = padLeft + frac * plotW;
            return (
              <line
                key={`vx-${frac}`}
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + plotH}
                className="stroke-slate-300/45 dark:stroke-white/[0.05]"
                strokeWidth="1"
              />
            );
          })}

          {/* Horizontal grid lines + dual color axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padTop + frac * plotH;
            const piVal = (piMax - frac * (piMax - piMin)).toFixed(1);
            const dtVal = (dtMax - frac * (dtMax - dtMin)).toFixed(1);
            return (
              <g key={frac}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-slate-300/60 dark:stroke-white/[0.08]"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 7}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-sky-600 dark:fill-sky-400/80 text-[10px] font-mono"
                >
                  {piVal}%
                </text>
                <text
                  x={width - padRight + 7}
                  y={y + 3}
                  textAnchor="start"
                  className="fill-amber-600 dark:fill-amber-400/80 text-[10px] font-mono"
                >
                  {dtVal}°
                </text>
              </g>
            );
          })}

          {/* Shaded vertical episode bands */}
          {points.map((pt, idx) => {
            if (pt.packet.ml_class === 0) return null;
            const x = toX(idx);
            const colW = Math.max(4, plotW / Math.max(1, points.length - 1));
            const fill =
              pt.packet.ml_class === 2
                ? 'rgba(244, 63, 94, 0.18)'
                : 'rgba(245, 158, 11, 0.14)';
            return (
              <rect
                key={`band-${idx}`}
                x={x - colW / 2}
                y={padTop}
                width={colW}
                height={plotH}
                rx="2"
                fill={fill}
              />
            );
          })}

          {/* Threshold reference lines */}
          <line
            x1={padLeft}
            y1={toYPi(piThresholdPct)}
            x2={width - padRight}
            y2={toYPi(piThresholdPct)}
            stroke="#38BDF8"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1={padLeft}
            y1={toYDt(deltaTThresholdC)}
            x2={width - padRight}
            y2={toYDt(deltaTThresholdC)}
            stroke="#F59E0B"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Smooth Bezier Data Curves + Luminous Area Fills */}
          {points.length > 1 && (
            <>
              <path d={dtAreaPath} fill={`url(#${dtGradId})`} />
              <path d={piAreaPath} fill={`url(#${piGradId})`} />
              <path
                d={dtPath}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.1"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${dtGlowId})`}
              />
              <path
                d={piPath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${piGlowId})`}
              />
              {lastPoint && (
                <g>
                  <circle
                    cx={toX(lastIdx)}
                    cy={toYPi(lastPoint.packet.perfusion_index)}
                    r="8"
                    fill="#38BDF8"
                    fillOpacity="0.22"
                  />
                  <circle
                    cx={toX(lastIdx)}
                    cy={toYPi(lastPoint.packet.perfusion_index)}
                    r="4"
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                  />
                  <circle
                    cx={toX(lastIdx)}
                    cy={toYDt(lastPoint.packet.delta_t)}
                    r="6.5"
                    fill="#F59E0B"
                    fillOpacity="0.2"
                  />
                  <circle
                    cx={toX(lastIdx)}
                    cy={toYDt(lastPoint.packet.delta_t)}
                    r="3.5"
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1.4"
                  />
                </g>
              )}
            </>
          )}

          {/* Hardware event-marker pins */}
          {points.map((pt, idx) => {
            if (!pt.packet.hw_event_btn) return null;
            const x = toX(idx);
            return (
              <g key={`pin-${idx}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotH}
                  className="stroke-rose-500"
                  strokeWidth="1.5"
                />
                <circle cx={x} cy={padTop + 6} r="5" className="fill-rose-500/30" />
                <circle cx={x} cy={padTop + 6} r="3.2" className="fill-rose-500" />
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hoverIdx !== null && points[hoverIdx] && (
            <g>
              <line
                x1={toX(hoverIdx)}
                y1={padTop}
                x2={toX(hoverIdx)}
                y2={padTop + plotH}
                stroke="#94A3B8"
                strokeOpacity="0.7"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={toX(hoverIdx)}
                cy={toYPi(points[hoverIdx].packet.perfusion_index)}
                r="7.5"
                fill="#38BDF8"
                fillOpacity="0.24"
              />
              <circle
                cx={toX(hoverIdx)}
                cy={toYPi(points[hoverIdx].packet.perfusion_index)}
                r="4.5"
                fill="#38BDF8"
                stroke="#FFFFFF"
                strokeWidth="1.6"
              />
              <circle
                cx={toX(hoverIdx)}
                cy={toYDt(points[hoverIdx].packet.delta_t)}
                r="4.5"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="1.6"
              />
            </g>
          )}

          {/* X-axis timestamps */}
          {points.length > 1 &&
            [0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
              <text
                key={`x-${idx}`}
                x={toX(idx)}
                y={height - 8}
                textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
              >
                {points[idx]?.timeLabel}
              </text>
            ))}
        </svg>
      </div>
    </div>
  );
}
