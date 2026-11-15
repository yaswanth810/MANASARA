import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Convenience shorthand: render as a circle (e.g. avatars) */
  circle?: boolean;
}

/**
 * Skeleton
 * Pulsing placeholder block used while async data loads.
 * Compose multiple Skeletons inside a card to match the real layout.
 */
function Skeleton({ className, circle = false, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-[#EADFE0]',
        circle ? 'rounded-full' : 'rounded-sm',
        className
      )}
      {...props}
    />
  );
}
Skeleton.displayName = 'Skeleton';

export { Skeleton };
