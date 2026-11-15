import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Table wrapper (adds horizontal scroll on small screens) ────────────── */
const TableWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('w-full overflow-x-auto', className)}
    {...props}
  />
));
TableWrapper.displayName = 'TableWrapper';

/* ─── Table ──────────────────────────────────────────────────────────────── */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn(
      'w-full caption-bottom border-collapse',
      'font-dm-sans text-sm text-[#403238]',
      className
    )}
    {...props}
  />
));
Table.displayName = 'Table';

/* ─── Header ─────────────────────────────────────────────────────────────── */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('border-b border-[#EADFE0] bg-[#FBF7F2]', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

/* ─── Body ───────────────────────────────────────────────────────────────── */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

/* ─── Footer ─────────────────────────────────────────────────────────────── */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-[#EADFE0] bg-[#FBF7F2] font-medium',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

/* ─── Row ────────────────────────────────────────────────────────────────── */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-[#EADFE0] transition-colors duration-100',
      'hover:bg-[#FBF7F2] data-[state=selected]:bg-[#F6E8EC]',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

/* ─── Head cell ──────────────────────────────────────────────────────────── */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-left align-middle',
      'text-xs font-semibold text-[#403238]/50 uppercase tracking-wider',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

/* ─── Data cell ──────────────────────────────────────────────────────────── */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-3 align-middle',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

/* ─── Caption ────────────────────────────────────────────────────────────── */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-[#403238]/50', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
