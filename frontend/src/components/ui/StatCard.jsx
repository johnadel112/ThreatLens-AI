import { motion } from 'framer-motion';

const accentMap = {
  cyan: 'from-cyan-500/20 to-transparent text-cyan-300 border-cyan-500/20',
  red: 'from-red-500/20 to-transparent text-red-300 border-red-500/20',
  amber: 'from-amber-500/20 to-transparent text-amber-300 border-amber-500/20',
  purple: 'from-purple-500/20 to-transparent text-purple-300 border-purple-500/20',
  green: 'from-emerald-500/20 to-transparent text-emerald-300 border-emerald-500/20',
};

export default function StatCard({ label, value, sub, icon: Icon, accent = 'cyan', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glass-panel-hover p-5 relative overflow-hidden border ${accentMap[accent]?.split(' ').pop() || ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[accent]?.split(' text-')[0] || accentMap.cyan.split(' text-')[0]} pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-gray-400 leading-snug whitespace-nowrap">{label}</p>
          {Icon && <Icon className={`w-5 h-5 shrink-0 ${accentMap[accent]?.match(/text-\S+/)?.[0] || 'text-cyan-300'}`} />}
        </div>
        <p className="text-3xl font-bold text-white mt-2 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{sub}</p>}
      </div>
    </motion.div>
  );
}
