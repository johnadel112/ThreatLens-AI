const CHIP_STYLES = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/25',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  low: 'bg-gray-500/15 text-gray-300 border-gray-500/25',
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
};

export default function SeverityChipRow({ bySeverity = [], compact = false }) {
  const items = bySeverity.filter((s) => s.count > 0);
  if (!items.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-2' : 'mt-3'}`}>
      {items.map((item) => (
        <span
          key={item.severity}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium capitalize ${
            CHIP_STYLES[item.severity] || CHIP_STYLES.low
          }`}
        >
          <span className="opacity-80">{item.severity}</span>
          <span className="font-mono tabular-nums">{item.count}</span>
        </span>
      ))}
    </div>
  );
}
