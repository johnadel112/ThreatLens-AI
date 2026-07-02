export default function LivePulseIndicator({ active = false, label = 'Live SOC Monitoring', compact = false }) {
  if (!active) {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full text-xs border border-white/10 text-gray-500 bg-white/[0.02] ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
        <span className="w-2 h-2 rounded-full bg-gray-600" />
        {!compact && 'Monitoring inactive'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] ${compact ? 'px-2 py-1' : 'px-4 py-2'}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      {!compact && label}
      {compact && <span className="hidden sm:inline">{label}</span>}
    </span>
  );
}
