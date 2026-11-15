import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      // Track shape
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center',
      'rounded-full border-2 border-transparent',
      // Off state
      'bg-[#EADFE0]',
      // On state — dusty pink
      'data-[state=checked]:bg-[#D98C9E]',
      // Focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D98C9E] focus-visible:ring-offset-2',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-150',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        // Thumb circle
        'pointer-events-none block size-4 rounded-full bg-white shadow-sm',
        // Animation
        'transition-transform duration-150',
        'translate-x-0 data-[state=checked]:translate-x-4',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
