import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Provider ───────────────────────────────────────────────────────────── */
const ToastProvider = ToastPrimitive.Provider;

/* ─── Viewport ───────────────────────────────────────────────────────────── */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

/* ─── Toast variants ─────────────────────────────────────────────────────── */
const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-start gap-3',
    'overflow-hidden rounded-sm border p-4 pr-10 shadow-md',
    'font-dm-sans text-sm text-[#403238]',
    'transition-all duration-300 ease-in-out',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=end]:opacity-0',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
  ],
  {
    variants: {
      variant: {
        default: 'bg-white border-[#EADFE0]',
        destructive: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warning: 'bg-[#E8C77B]/20 border-[#E8C77B] text-[#403238]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

/* ─── Toast root ─────────────────────────────────────────────────────────── */
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

/* ─── Action button ──────────────────────────────────────────────────────── */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-sm border border-[#EADFE0]',
      'bg-transparent px-3 py-1 text-xs font-medium text-[#403238]',
      'transition-colors hover:bg-[#F6E8EC] focus:outline-none focus:ring-2 focus:ring-[#D98C9E]',
      'disabled:pointer-events-none disabled:opacity-50',
      // Destructive group override
      'group-[.destructive]:border-red-200 group-[.destructive]:hover:bg-red-100',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

/* ─── Close button ───────────────────────────────────────────────────────── */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    toast-close=""
    className={cn(
      'absolute right-2 top-2 rounded-sm p-0.5 text-[#403238]/40',
      'hover:text-[#403238] focus:outline-none focus:ring-2 focus:ring-[#D98C9E]',
      'transition-colors',
      className
    )}
    {...props}
  >
    <X className="size-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

/* ─── Title & Description ────────────────────────────────────────────────── */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('font-semibold leading-snug', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('mt-0.5 text-xs opacity-70', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

/* ─── Types ──────────────────────────────────────────────────────────────── */
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
export type { ToastProps, ToastActionElement };
