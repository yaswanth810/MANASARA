import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        // Layout
        'flex min-h-[80px] w-full',
        // Surface
        'rounded-sm border border-[#EADFE0] bg-white px-3 py-2',
        // Typography
        'font-dm-sans text-sm text-[#403238] placeholder:text-[#403238]/40',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D98C9E] focus-visible:ring-offset-1',
        // States
        'disabled:cursor-not-allowed disabled:opacity-50',
        'read-only:bg-[#FBF7F2] read-only:cursor-default',
        // Resize handle — keep it subtle
        'resize-y',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
