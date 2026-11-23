import React from 'react';
import { Knob } from 'primereact/knob';
import { Tooltip } from '@mui/material';

interface BiometricRingGaugeProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  textColor: string;
  label?: string;
  displayText: string;
  tooltip?: string;
}

export function BiometricRingGauge({
  value,
  min = 0,
  max = 100,
  size = 64,
  strokeWidth = 9,
  color,
  trackColor,
  textColor,
  label,
  displayText,
  tooltip,
}: BiometricRingGaugeProps) {
  const clamped = Math.min(max, Math.max(min, value));

  const ring = (
    <div className="inline-flex flex-col items-center justify-center shrink-0">
      <div
        className="relative inline-flex items-center justify-center rounded-full bg-white/35 dark:bg-white/[0.04] backdrop-blur-md ring-1 ring-white/55 dark:ring-white/12 shadow-[inset_0_1px_2px_rgba(255,255,255,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] text-slate-900 dark:text-white"
        style={{ width: size, height: size }}
      >
        <Knob
          value={clamped}
          min={min}
          max={max}
          size={size}
          strokeWidth={strokeWidth}
          readOnly
          showValue={false}
          rangeColor={trackColor}
          valueColor={color}
          textColor={textColor}
          aria-label={label ?? displayText}
          pt={{
            root: { className: 'inline-flex items-center justify-center' },
            value: {
              style: {
                filter: `drop-shadow(0 0 8px ${color}66)`,
              },
            },
          }}
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono tabular-nums font-bold tracking-tight"
          style={{
            fontSize: size >= 64 ? '13.5px' : '11.5px',
            color: textColor,
          }}
        >
          {displayText}
        </span>
      </div>
      {label && (
        <span className="mt-1 text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {ring}
      </Tooltip>
    );
  }

  return ring;
}
