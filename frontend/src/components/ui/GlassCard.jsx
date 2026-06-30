export default function GlassCard({ children, className = '', glow = false, padding = true, ...props }) {
  return (
    <div
      className={`glass-panel ${glow ? 'shadow-glow-cyan border-soc-border-bright' : ''} ${padding ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
