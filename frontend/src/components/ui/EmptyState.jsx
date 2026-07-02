import EmptyStateArt from '../visuals/EmptyStateArt';

export default function EmptyState({ icon: Icon, title, description, action, variant }) {
  return (
    <div className="glass-panel p-8 sm:p-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-soc-accent/[0.02] to-transparent pointer-events-none" />
      <div className="relative">
        {variant ? (
          <div className="inline-flex items-center justify-center mb-5">
            <EmptyStateArt variant={variant} />
          </div>
        ) : Icon ? (
          <div className="inline-flex w-14 h-14 rounded-2xl bg-soc-accent/10 border border-soc-accent/20 items-center justify-center mb-4">
            <Icon className="w-7 h-7 text-soc-accent" />
          </div>
        ) : null}
        <p className="text-lg font-medium text-white">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
