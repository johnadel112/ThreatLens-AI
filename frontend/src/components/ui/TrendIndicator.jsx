export default function TrendIndicator({ trend, className = '' }) {
  if (!trend?.label) return null;

  const color =
    trend.direction === 'up'
      ? 'text-amber-300'
      : trend.direction === 'down'
        ? 'text-emerald-300'
        : 'text-gray-500';

  return (
    <p className={`text-[11px] font-medium ${color} ${className}`}>
      {trend.label}
    </p>
  );
}
