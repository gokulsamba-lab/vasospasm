import React from 'react';
import { Tag } from 'primereact/tag';
import { cn } from '../../lib/utils';

type Tone = 'mint' | 'blue' | 'amber' | 'rose' | 'slate';

const TONE_MAP: Record<Tone, string> = {
  mint: 'bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 border-emerald-400/35',
  blue: 'bg-sky-400/15 text-sky-800 dark:text-sky-300 border-sky-400/35',
  amber: 'bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/35',
  rose: 'bg-rose-400/15 text-rose-800 dark:text-rose-300 border-rose-400/35',
  slate: 'bg-white/55 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300 border-white/65 dark:border-white/14',
};

interface PrimeStatusTagProps {
  value: string;
  tone?: Tone;
  className?: string;
}

export function PrimeStatusTag({ value, tone = 'slate', className }: PrimeStatusTagProps) {
  return (
    <Tag
      value={value}
      unstyled
      pt={{
        root: {
          className: cn(
            'inline-flex items-center rounded-lg border backdrop-blur-md px-2 py-0.5 text-[11px] font-mono tabular-nums font-medium whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
            TONE_MAP[tone],
            className
          ),
        },
      }}
    />
  );
}
