export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="glass-panel p-10 text-center">
      {Icon && (
        <div className="inline-flex w-14 h-14 rounded-2xl bg-soc-accent/10 border border-soc-accent/20 items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-soc-accent" />
        </div>
      )}
      <p className="text-lg font-medium text-white">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
