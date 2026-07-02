import { Link } from 'react-router-dom';
import RiskScoreBadge from '../ui/RiskScoreBadge';
import MitreTechniqueBadge from '../ui/MitreTechniqueBadge';
import SeverityBadge from '../ui/SeverityBadge';

export default function IntelligenceOverview({ incidents = [] }) {
  if (!incidents.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Risk intelligence will appear as cases are correlated.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {incidents.map((inc) => (
        <Link
          key={inc.id}
          to={`/incidents/${inc.id}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-black/20 hover:border-soc-accent/30 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-medium truncate">{inc.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <SeverityBadge severity={inc.severity} />
              {inc.mitreTactic && <MitreTechniqueBadge tactic={inc.mitreTactic} compact />}
              {inc.username && <span className="text-[10px] text-gray-500">{inc.username}</span>}
            </div>
          </div>
          <RiskScoreBadge score={inc.riskScore} />
        </Link>
      ))}
    </div>
  );
}
