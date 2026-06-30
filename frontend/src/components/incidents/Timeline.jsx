const sourceStyles = {
  event: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  alert: 'bg-soc-warning/20 text-amber-300 border-soc-warning/30',
  agent: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  analyst: 'bg-soc-success/20 text-emerald-300 border-soc-success/30',
};

function formatTime(value) {
  return new Date(value).toLocaleString();
}

export default function Timeline({ entries = [] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">No timeline entries yet.</p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-soc-border" />
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={`${entry.refId}-${index}`} className="relative pl-10">
            <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-soc-surface border-2 border-soc-accent" />
            <div className="bg-soc-bg border border-soc-border rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs text-gray-500">{formatTime(entry.timestamp)}</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs border capitalize ${sourceStyles[entry.source] || sourceStyles.event}`}
                >
                  {entry.source}
                </span>
              </div>
              <h4 className="text-sm font-medium text-white capitalize">{entry.title}</h4>
              {entry.description && (
                <p className="text-sm text-gray-400 mt-1">{entry.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
