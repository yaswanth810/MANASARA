import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  [
    'relative w-full rounded-sm border p-4',
    'font-dm-sans text-sm text-[#403238]',
    '[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4',
    '[&>svg~*]:pl-7', // indent content when an icon is present
  ],
  {
    variants: {
      variant: {
        default:
          'bg-[#FBF7F2] border-[#EADFE0] text-[#403238]',
        destructive:
          'bg-red-50 border-red-200 text-red-800 [&>svg]:text-red-600',
        success:
          'bg-emerald-50 border-emerald-200 text-emerald-800 [&>svg]:text-emerald-600',
        warning:
          'bg-[#E8C77B]/15 border-[#E8C77B] text-[#403238] [&>svg]:text-[#E8C77B]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

/* ─── Root ───────────────────────────────────────────────────────────────── */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

/* ─── Title ──────────────────────────────────────────────────────────────── */
const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

/* ─── Description ────────────────────────────────────────────────────────── */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm opacity-80 [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
