import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { buildSecurityBriefing } from '../../utils/dashboardMetrics';
import GlassCard from '../ui/GlassCard';

export default function AIBriefingPanel({ stats, threatScore = 0 }) {
  const briefing = buildSecurityBriefing({ ...stats, _threatScore: threatScore });

  return (
    <GlassCard className="border border-purple-500/15 bg-gradient-to-br from-purple-500/[0.06] to-transparent">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Security Briefing</h3>
            <p className="text-[11px] text-gray-500">Rule-based SOC summary from live workspace data</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/25 text-purple-300">
          {briefing.level}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Current situation</p>
          <p className="text-sm text-gray-300 leading-relaxed">{briefing.situation}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">Recommended focus</p>
          <ol className="space-y-2">
            {briefing.focus.map((item, i) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-soc-accent font-mono text-xs mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/[0.06]">
        <Link to="/incidents" className="btn-ghost text-xs py-2 min-h-[44px]">
          Review cases <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link to="/playbooks" className="btn-ghost text-xs py-2 min-h-[44px]">
          SOAR queue <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </GlassCard>
  );
}
