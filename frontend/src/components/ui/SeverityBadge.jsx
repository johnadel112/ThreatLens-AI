const styles = {
  info: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  low: 'bg-gray-500/15 text-gray-300 border-gray-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  critical: 'bg-red-500/15 text-red-300 border-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
};

export default function SeverityBadge({ severity }) {
  const key = severity?.toLowerCase() || 'low';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${styles[key] || styles.low}`}
    >
      {severity || 'low'}
    </span>
  );
}
