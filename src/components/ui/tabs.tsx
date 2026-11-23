import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (val: string) => void;
}

export function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border border-white/65 dark:border-white/12 bg-white/45 dark:bg-white/[0.05] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, onClick, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      onClick={(e) => {
        ctx?.onValueChange(value);
        onClick?.(e);
      }}
      className={cn(
        'min-h-[34px] px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50',
        active
          ? 'bg-gradient-to-r from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_-4px_rgba(29,140,248,0.55)]'
          : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/[0.07] hover:text-slate-900 dark:hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
