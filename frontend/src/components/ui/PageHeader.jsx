export default function PageHeader({ title, subtitle, badge, actions }) {
  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        {badge}
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1.5 text-sm lg:text-base max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
