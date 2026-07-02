export default function MitreTechniqueBadge({ tactic, technique, techniqueId, compact = false }) {
  if (!tactic && !technique) return null;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border border-purple-500/25 bg-purple-500/10 text-purple-200"
        title={technique ? `${technique}${techniqueId ? ` (${techniqueId})` : ''}` : tactic}
      >
        {techniqueId || tactic}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5">
      {tactic && <span className="text-[10px] uppercase tracking-wide text-purple-300/80">{tactic}</span>}
      <span className="text-xs text-white font-medium leading-snug">
        {technique || 'Unknown technique'}
        {techniqueId && <span className="text-purple-300/70 font-mono ml-1.5">{techniqueId}</span>}
      </span>
    </div>
  );
}
