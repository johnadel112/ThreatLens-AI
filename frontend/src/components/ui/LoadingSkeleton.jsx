export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <SkeletonLine className="h-80 xl:col-span-2" />
        <SkeletonLine className="h-80" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SkeletonLine className="h-72" />
        <SkeletonLine className="h-72" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="glass-panel p-5 space-y-3">
      <SkeletonLine className="h-8 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className="h-12" />
      ))}
    </div>
  );
}
