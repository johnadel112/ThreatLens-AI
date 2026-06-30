const styles = {
  open: 'bg-soc-critical/20 text-red-300 border-soc-critical/30',
  acknowledged: 'bg-soc-warning/20 text-amber-300 border-soc-warning/30',
  resolved: 'bg-soc-success/20 text-emerald-300 border-soc-success/30',
  false_positive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function StatusBadge({ status }) {
  const key = status || 'open';
  const label = key.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${styles[key] || styles.open}`}
    >
      {label}
    </span>
  );
}
