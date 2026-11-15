import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Layout & typography
          'flex h-9 w-full',
          'font-dm-sans text-sm text-[#403238] placeholder:text-[#403238]/40',
          // Surface
          'rounded-sm border border-[#EADFE0] bg-white px-3 py-1',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D98C9E] focus-visible:ring-offset-1',
          // States
          'disabled:cursor-not-allowed disabled:opacity-50',
          'read-only:bg-[#FBF7F2] read-only:cursor-default',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#403238]',
          // Autofill override
          'autofill:bg-white',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
