import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles — font-dm-sans, tight letter-spacing, minimal radius
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-dm-sans text-sm font-medium tracking-wide',
    'rounded-sm border border-transparent',
    'transition-colors duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D98C9E] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // Deep plum — primary CTA
        default:
          'bg-[#403238] text-[#FBF7F2] hover:bg-[#5a474f] active:bg-[#2e2328]',
        // Dusty pink — accent CTA
        accent:
          'bg-[#D98C9E] text-white hover:bg-[#c97a8c] active:bg-[#b8697b]',
        // Blush rose — secondary/subtle
        secondary:
          'bg-[#F6E8EC] text-[#403238] border-[#EADFE0] hover:bg-[#f0dce2] active:bg-[#eacfd8]',
        // Transparent with plum border
        outline:
          'bg-transparent text-[#403238] border-[#EADFE0] hover:bg-[#FBF7F2] active:bg-[#F6E8EC]',
        // Fully transparent
        ghost:
          'bg-transparent text-[#403238] hover:bg-[#F6E8EC] active:bg-[#EADFE0]',
        // Destructive / error
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 py-1 text-xs',
        lg: 'h-11 px-6 py-3 text-base',
        icon: 'h-9 w-9 p-0',
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
  /** Render as a child element (e.g. a link) using Radix Slot */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
