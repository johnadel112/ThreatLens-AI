const variants = {
  events: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <circle cx="40" cy="40" r="36" fill="#22d3ee" fillOpacity="0.08" />
      <path d="M24 44h32M28 32h24M32 52h16" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="52" cy="28" r="6" fill="none" stroke="#a855f7" strokeOpacity="0.6" strokeWidth="1.5" />
      <path d="M20 20 L28 28" stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  ),
  alerts: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <path d="M40 14 L62 58 H18 Z" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M40 30 V44" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="50" r="2" fill="#f59e0b" />
    </svg>
  ),
  cases: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <rect x="18" y="22" width="44" height="36" rx="4" fill="#22d3ee" fillOpacity="0.08" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M26 34h28M26 42h20M26 50h14" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="56" cy="26" r="8" fill="#a855f7" fillOpacity="0.15" stroke="#a855f7" strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <path d="M28 16 H48 L58 26 V62 H28 Z" fill="#22d3ee" fillOpacity="0.08" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M48 16 V26 H58" fill="none" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M34 36h22M34 44h18M34 52h14" stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="8" r="4" fill="#10b981" fillOpacity="0.3" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <rect x="20" y="18" width="40" height="48" rx="3" fill="#a855f7" fillOpacity="0.08" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M28 32h24M28 40h20M28 48h16M28 56h12" stroke="#a855f7" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M48 52 L54 58 L66 42" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <circle cx="40" cy="40" r="8" fill="#22d3ee" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.5" />
      {[[20,25],[60,25],[20,55],[60,55]].map(([x,y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeOpacity="0.4" strokeWidth="1" />
          <line x1={x} y1={y} x2="40" y2="40" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="1" />
        </g>
      ))}
    </svg>
  ),
  default: (
    <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden>
      <circle cx="40" cy="40" r="30" fill="#22d3ee" fillOpacity="0.1" stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1.5" />
    </svg>
  ),
};

export default function EmptyStateArt({ variant = 'default', className = '' }) {
  return (
    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${className}`} role="presentation">
      {variants[variant] || variants.default}
    </div>
  );
}
