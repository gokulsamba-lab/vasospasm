import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ring-1 ring-inset transition-colors whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  {
    variants: {
      variant: {
        neutral:
          'bg-white/60 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200 ring-white/70 dark:ring-white/15',
        blue:
          'bg-sky-400/15 dark:bg-sky-400/15 text-sky-800 dark:text-sky-300 ring-sky-400/35 dark:ring-sky-400/30',
        mint:
          'bg-emerald-400/15 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 ring-emerald-400/35 dark:ring-emerald-400/30',
        amber:
          'bg-amber-400/15 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 ring-amber-400/35 dark:ring-amber-400/30',
        rose:
          'bg-rose-400/15 dark:bg-rose-400/15 text-rose-800 dark:text-rose-300 ring-rose-400/35 dark:ring-rose-400/30',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
