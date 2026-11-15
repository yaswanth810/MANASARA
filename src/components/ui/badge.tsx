import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'rounded-sm border px-2 py-0.5',
    'font-dm-sans text-xs font-medium',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#D98C9E] focus:ring-offset-1',
  ],
  {
    variants: {
      variant: {
        // Deep plum — default status
        default:
          'bg-[#403238] text-[#FBF7F2] border-[#403238]',
        // Muted grey-blue — draft / unpublished
        draft:
          'bg-[#EADFE0] text-[#403238]/70 border-[#EADFE0]',
        // Muted leaf — active / live
        active:
          'bg-[#71836A]/15 text-[#71836A] border-[#71836A]/30',
        // Transparent with border
        outline:
          'bg-transparent text-[#403238] border-[#EADFE0]',
        // Red — error / danger
        destructive:
          'bg-red-50 text-red-700 border-red-200',
        // Green — success / confirmed
        success:
          'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant, className }))} {...props} />
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
