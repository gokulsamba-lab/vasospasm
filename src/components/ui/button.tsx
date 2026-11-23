import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 cursor-pointer backdrop-blur-md',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_22px_-6px_rgba(29,140,248,0.55)] hover:brightness-110',
        mint:
          'bg-gradient-to-r from-[#10B981] to-[#34D399] text-slate-950 border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:brightness-105',
        destructive:
          'border border-rose-300/70 dark:border-rose-400/30 bg-rose-500/12 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-rose-500/20',
        outline:
          'border border-white/70 dark:border-white/15 bg-white/55 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/80 dark:hover:bg-white/[0.11] hover:border-white dark:hover:border-white/25',
        secondary:
          'bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-950 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-6px_rgba(15,23,42,0.35)] hover:bg-slate-900 dark:hover:bg-white',
        ghost:
          'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/[0.08] hover:text-slate-950 dark:hover:text-white',
      },
      size: {
        default: 'min-h-[40px] px-4 py-2',
        sm: 'min-h-[36px] px-3 py-1.5',
        lg: 'min-h-[44px] px-5 py-2.5 text-sm',
        icon: 'min-h-[40px] min-w-[40px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
