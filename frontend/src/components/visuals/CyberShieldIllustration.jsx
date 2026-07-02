/** Abstract cybersecurity shield + network illustration (inline SVG). */
export default function CyberShieldIllustration({ className = '', compact = false }) {
  const size = compact ? 120 : 320;

  return (
    <svg
      viewBox="0 0 320 320"
      width={size}
      height={size}
      className={className}
      aria-hidden={!compact}
      aria-label={compact ? undefined : 'Abstract cybersecurity network illustration'}
      role="img"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="160" cy="150" r="130" fill="url(#glowGrad)" />

      {/* Network lines */}
      <g stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="1" fill="none">
        <path d="M40 200 Q100 120 160 160 T280 200" />
        <path d="M60 100 Q160 60 260 100" />
        <path d="M80 240 L160 180 L240 240" />
        <circle cx="80" cy="200" r="3" fill="#22d3ee" fillOpacity="0.5" />
        <circle cx="160" cy="160" r="4" fill="#22d3ee" fillOpacity="0.6" />
        <circle cx="240" cy="200" r="3" fill="#a855f7" fillOpacity="0.5" />
        <circle cx="120" cy="100" r="2.5" fill="#22d3ee" fillOpacity="0.4" />
        <circle cx="200" cy="90" r="2.5" fill="#a855f7" fillOpacity="0.4" />
      </g>

      {/* Shield */}
      <path
        d="M160 55 L230 85 L230 155 Q230 215 160 250 Q90 215 90 155 L90 85 Z"
        fill="url(#shieldGrad)"
        fillOpacity="0.15"
        stroke="url(#shieldGrad)"
        strokeWidth="2"
        filter="url(#softGlow)"
      />
      <path
        d="M160 80 L205 100 L205 150 Q205 190 160 215 Q115 190 115 150 L115 100 Z"
        fill="none"
        stroke="#22d3ee"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <path
        d="M145 155 L155 170 L180 135"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Grid accent */}
      <g stroke="#22d3ee" strokeOpacity="0.06" strokeWidth="0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="0" y1={60 + i * 50} x2="320" y2={60 + i * 50} />
        ))}
      </g>
    </svg>
  );
}
