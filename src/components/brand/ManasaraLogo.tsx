import { cn } from '@/lib/utils'

interface ManasaraLogoProps {
  variant?: 'dark' | 'light'
  showTagline?: boolean
  className?: string
}

/**
 * MANASARA wordmark with abstract chenille-loop mark.
 * Renders as an inline SVG for maximum flexibility (favicon, header, footer).
 * Works in one colour — use variant='light' on dark backgrounds.
 */
export function ManasaraLogo({ variant = 'dark', showTagline = false, className }: ManasaraLogoProps) {
  const textColor = variant === 'light' ? '#FBF7F2' : '#403238'
  const accentColor = variant === 'light' ? '#D98C9E' : '#D98C9E'  // dusty pink always

  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('overflow-visible', className)}
      aria-label="MANASARA"
      role="img"
    >
      {/* Abstract chenille-loop mark */}
      {/* A continuous looping line that evokes a pipe-cleaner stem / petal */}
      <g transform="translate(0, 2)">
        <path
          d="M12 30 C8 30, 4 26, 4 20 C4 14, 8 10, 14 10 C20 10, 22 15, 20 19 C18 23, 14 22, 14 22 C14 22, 10 21, 10 25 C10 29, 14 32, 18 30"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top petal dot */}
        <circle cx="14" cy="10" r="2" fill={accentColor} />
        {/* Base dot */}
        <circle cx="18" cy="30" r="1.5" fill={textColor} opacity="0.4" />
      </g>

      {/* MANASARA wordmark */}
      <text
        x="26"
        y="26"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="20"
        fontWeight="500"
        letterSpacing="0.04em"
        fill={textColor}
      >
        MANASARA
      </text>

      {/* Optional tagline */}
      {showTagline && (
        <text
          x="26"
          y="38"
          fontFamily="DM Sans, system-ui, sans-serif"
          fontSize="7"
          letterSpacing="0.12em"
          fill={textColor}
          opacity="0.5"
        >
          SMALL GIFTS. BIG FEELINGS.
        </text>
      )}
    </svg>
  )
}
