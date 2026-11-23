import * as React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full min-h-[40px] rounded-xl border border-white/65 dark:border-white/12 bg-white/55 dark:bg-white/[0.05] backdrop-blur-md px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-sky-400/45 focus:border-sky-400/70 transition-all disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex w-full min-h-[40px] rounded-xl border border-white/65 dark:border-white/12 bg-white/55 dark:bg-white/[0.05] backdrop-blur-md px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400/45 focus:border-sky-400/70 transition-all disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Input, Select };
