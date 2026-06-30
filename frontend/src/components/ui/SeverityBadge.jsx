const styles = {
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  medium: 'bg-soc-warning/20 text-amber-300 border-soc-warning/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-soc-critical/20 text-red-300 border-soc-critical/30',
};

export default function SeverityBadge({ severity }) {
  const key = severity?.toLowerCase() || 'low';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${styles[key] || styles.low}`}
    >
      {severity || 'low'}
    </span>
  );
}
