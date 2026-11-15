import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Layout
      'peer size-4 shrink-0',
      // Surface
      'rounded-sm border border-[#EADFE0] bg-white',
      // Checked state — dusty pink background
      'data-[state=checked]:bg-[#D98C9E] data-[state=checked]:border-[#D98C9E] data-[state=checked]:text-white',
      // Indeterminate state
      'data-[state=indeterminate]:bg-[#D98C9E]/40 data-[state=indeterminate]:border-[#D98C9E]',
      // Focus
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D98C9E] focus-visible:ring-offset-1',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="size-3 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
