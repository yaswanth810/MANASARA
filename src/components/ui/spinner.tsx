import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Tailwind size class — defaults to size-5 */
  size?: string;
  /** Accessible label */
  label?: string;
}

/**
 * Spinner
 * Lightweight SVG spinner using MANASARA dusty-pink + soft-line colours.
 * Use inside buttons, overlays, or any loading state.
 */
const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'size-5', label = 'Loading…', ...props }, ref) => (
    <svg
      ref={ref}
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('animate-spin shrink-0', size, className)}
      {...props}
    >
      {/* Track */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#EADFE0"
        strokeWidth="3"
      />
      {/* Arc */}
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#D98C9E"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
);
Spinner.displayName = 'Spinner';

export { Spinner };
