import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

const statusStyles = {
  new: 'text-red-300',
  investigating: 'text-soc-accent',
  contained: 'text-amber-300',
  resolved: 'text-emerald-300',
  closed: 'text-gray-500',
};

export default function RecentIncidentsPanel({ incidents = [] }) {
  if (incidents.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">No active cases yet — detection engine monitoring.</p>;
  }

  return (
    <div className="space-y-2">
      {incidents.map((inc) => (
        <Link
          key={inc.id}
          to={`/incidents/${inc.id}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-soc-accent/25 hover:bg-soc-accent/5 transition-all group"
        >
          <SeverityBadge severity={inc.severity} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate group-hover:text-soc-accent transition-colors">
              {inc.title}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              <span className={`capitalize ${statusStyles[inc.status] || ''}`}>{inc.status}</span>
              {' · '}{formatTime(inc.createdAt)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-soc-accent shrink-0" />
        </Link>
      ))}
    </div>
  );
}
