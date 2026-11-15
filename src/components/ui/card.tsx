import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─── Card shell ─────────────────────────────────────────────────────────── */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-sm border border-[#EADFE0] bg-white text-[#403238] shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

/* ─── Header ─────────────────────────────────────────────────────────────── */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 p-5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/* ─── Title ──────────────────────────────────────────────────────────────── */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-fraunces text-lg font-semibold leading-snug tracking-tight text-[#403238]',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/* ─── Description ────────────────────────────────────────────────────────── */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('font-dm-sans text-sm text-[#403238]/60', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/* ─── Content ────────────────────────────────────────────────────────────── */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-5 pt-0', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

/* ─── Footer ─────────────────────────────────────────────────────────────── */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center p-5 pt-0 border-t border-[#EADFE0] mt-4',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
