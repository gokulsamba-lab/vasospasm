export const glassDataTablePt = {
  root: { className: 'w-full' },
  wrapper: { className: 'overflow-x-auto' },
  table: { className: 'w-full text-left border-collapse text-xs' },
  thead: {
    className:
      'bg-white/45 dark:bg-white/[0.04] backdrop-blur-md border-b border-white/60 dark:border-white/12 text-slate-600 dark:text-slate-300',
  },
  tbody: {
    className: 'divide-y divide-slate-200/50 dark:divide-white/[0.07]',
  },
  bodyRow: {
    className: 'hover:bg-white/45 dark:hover:bg-white/[0.055] transition-colors',
  },
  emptyMessage: {
    className: 'p-10 text-center text-sm text-slate-500 dark:text-slate-400',
  },
};

export const glassColumnPt = (align: 'left' | 'right' = 'left') => ({
  headerCell: {
    className: `py-3 px-2.5 xl:px-3 font-semibold whitespace-nowrap ${
      align === 'right' ? 'text-right' : 'text-left'
    }`,
  },
  headerContent: {
    className: align === 'right' ? 'flex justify-end' : 'flex justify-start',
  },
  bodyCell: {
    className: `py-3 px-2.5 xl:px-3 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`,
  },
});
