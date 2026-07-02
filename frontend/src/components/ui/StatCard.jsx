import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrendIndicator from './TrendIndicator';
import SeverityChipRow from './SeverityChipRow';

const accentMap = {
  cyan: {
    border: 'border-cyan-500/20',
    gradient: 'from-cyan-500/20 to-transparent',
    icon: 'text-cyan-300',
  },
  red: {
    border: 'border-red-500/20',
    gradient: 'from-red-500/20 to-transparent',
    icon: 'text-red-300',
  },
  amber: {
    border: 'border-amber-500/20',
    gradient: 'from-amber-500/20 to-transparent',
    icon: 'text-amber-300',
  },
  purple: {
    border: 'border-purple-500/20',
    gradient: 'from-purple-500/20 to-transparent',
    icon: 'text-purple-300',
  },
  green: {
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-500/20 to-transparent',
    icon: 'text-emerald-300',
  },
};

export default function StatCard({
  label,
  value,
  sub,
  trend,
  breakdown,
  severityBreakdown,
  icon: Icon,
  accent = 'cyan',
  delay = 0,
  href,
}) {
  const styles = accentMap[accent] || accentMap.cyan;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-panel-hover p-4 sm:p-5 relative overflow-hidden border min-h-[132px] ${styles.border} ${
        href ? 'hover:border-soc-accent/30 transition-colors' : ''
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-400 leading-snug">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tabular-nums">{value}</p>
          </div>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl bg-black/25 border border-white/[0.06] flex items-center justify-center shrink-0 ${styles.icon}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
        {sub && <p className="text-[11px] sm:text-xs text-gray-500 mt-1.5 leading-relaxed">{sub}</p>}
        {trend && <TrendIndicator trend={trend} className="mt-1.5" />}
        {breakdown && <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{breakdown}</p>}
        {severityBreakdown?.length > 0 && (
          <SeverityChipRow bySeverity={severityBreakdown} compact />
        )}
      </div>
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }
  return content;
}
