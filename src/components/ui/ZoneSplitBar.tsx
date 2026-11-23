import React from 'react';
import BsProgressBar from 'react-bootstrap/ProgressBar';

export interface ZoneSegment {
  key: string;
  label: string;
  pct: number;
  color: string;
}

interface ZoneSplitBarProps {
  segments: ZoneSegment[];
  className?: string;
}

export function ZoneSplitBar({ segments, className = '' }: ZoneSplitBarProps) {
  return (
    <div className={className}>
      <BsProgressBar
        className="h-2.5 rounded-full overflow-hidden bg-white/45 dark:bg-white/[0.08] border border-white/60 dark:border-white/12 backdrop-blur-md"
        style={{ backgroundColor: undefined, height: '10px', borderRadius: '9999px' }}
      >
        {segments.map((seg) => (
          <BsProgressBar
            key={seg.key}
            now={Math.max(0, Math.min(100, seg.pct))}
            aria-label={`${seg.label}: ${seg.pct.toFixed(0)}%`}
            style={{ backgroundColor: seg.color }}
          />
        ))}
      </BsProgressBar>
    </div>
  );
}
