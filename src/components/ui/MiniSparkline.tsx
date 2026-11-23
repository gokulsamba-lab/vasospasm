import React, { useId } from 'react';

interface MiniSparklineProps {
  values: number[];
  color: string;
  min?: number;
  max?: number;
  className?: string;
}

function buildSmoothPath(coords: Array<{ x: number; y: number }>): string {
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

export function MiniSparkline({
  values,
  color,
  min,
  max,
  className = 'w-20 h-7',
}: MiniSparklineProps) {
  const gradId = useId();
  const glowId = useId();
  const pts = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const low = min ?? Math.min(...pts);
  const high = max ?? Math.max(...pts);
  const span = Math.max(0.0001, high - low);

  const w = 84;
  const h = 28;
  const padY = 4;
  const padX = 2;
  const coords = pts.map((v, idx) => {
    const x = padX + (idx / Math.max(1, pts.length - 1)) * (w - padX * 2);
    const norm = Math.min(1, Math.max(0, (v - low) / span));
    const y = h - padY - norm * (h - padY * 2);
    return { x, y };
  });

  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${h} L ${coords[0].x.toFixed(1)} ${h} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
          <stop offset="65%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        x1={padX}
        y1={h - padY}
        x2={w - padX}
        y2={h - padY}
        stroke={color}
        strokeOpacity="0.18"
        strokeWidth="0.75"
        strokeDasharray="2 2"
      />
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
      {last && (
        <>
          <circle cx={last.x} cy={last.y} r="4" fill={color} fillOpacity="0.24" />
          <circle cx={last.x} cy={last.y} r="2.1" fill={color} stroke="#FFFFFF" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
}
