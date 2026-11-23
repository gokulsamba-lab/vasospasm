import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { cn } from '../../lib/utils';

export interface PrimeSelectProps {
  inputId?: string;
  value: string;
  options: readonly string[];
  onChange: (nextValue: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function PrimeSelect({
  inputId,
  value,
  options,
  onChange,
  className,
  ariaLabel,
}: PrimeSelectProps) {
  const optionItems = options.map((opt) => ({ label: opt, value: opt }));

  return (
    <Dropdown
      inputId={inputId}
      value={value}
      options={optionItems}
      optionLabel="label"
      optionValue="value"
      aria-label={ariaLabel}
      onChange={(e) => onChange(String(e.value))}
      unstyled
      pt={{
        root: {
          className: cn(
            'relative flex w-full min-h-[40px] items-center justify-between rounded-xl border border-white/65 dark:border-white/14 bg-white/55 dark:bg-white/[0.055] backdrop-blur-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] focus-within:ring-2 focus-within:ring-sky-400/50 focus-within:border-sky-400/70 transition-all',
            className
          ),
        },
        input: {
          className: 'flex-1 truncate text-left text-xs font-medium text-slate-900 dark:text-slate-100 outline-none',
        },
        trigger: {
          className: 'ml-2 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0',
        },
        panel: {
          className:
            'z-[80] mt-1.5 overflow-hidden rounded-xl border border-white/75 dark:border-white/18 bg-white/85 dark:bg-[#0B1222]/85 backdrop-blur-2xl shadow-[0_18px_40px_-10px_rgba(15,23,42,0.35)] dark:shadow-[0_22px_50px_-12px_rgba(0,0,0,0.8)]',
        },
        wrapper: {
          className: 'max-h-60 overflow-y-auto py-1',
        },
        list: {
          className: 'm-0 p-0 list-none',
        },
        item: ({ context }: { context: { selected: boolean; focused: boolean } }) => ({
          className: cn(
            'px-3.5 py-2 text-xs cursor-pointer transition-colors',
            context.selected
              ? 'bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white font-semibold'
              : context.focused
              ? 'bg-sky-500/10 dark:bg-white/10 text-slate-900 dark:text-white'
              : 'text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 dark:hover:bg-white/[0.07]'
          ),
        }),
      }}
    />
  );
}
