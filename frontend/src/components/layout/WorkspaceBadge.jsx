export default function WorkspaceBadge({ compact = false }) {
  if (compact) {
    return (
      <span className="text-[10px] text-gray-500 truncate">
        Demo SOC · <span className="text-amber-300/90">Simulation</span>
      </span>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
      <span className="px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.02]">
        Workspace: <span className="text-gray-300">ThreatLens Demo SOC</span>
      </span>
      <span className="px-2 py-1 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-300">
        Simulation Mode
      </span>
    </div>
  );
}
