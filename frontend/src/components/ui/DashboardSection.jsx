export default function DashboardSection({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
