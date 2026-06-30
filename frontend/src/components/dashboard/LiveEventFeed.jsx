import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SeverityBadge from '../ui/SeverityBadge';

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString();
}

export default function LiveEventFeed({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        <div className="inline-flex gap-1 mb-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-soc-accent animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
        Awaiting live security events…
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
      {events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={i === 0 ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-soc-accent/20 transition-colors"
        >
          <SeverityBadge severity={event.severity} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-soc-accent truncate">{event.eventType}</p>
            <p className="text-[11px] text-gray-500 truncate">
              {event.username || '—'} · {event.ip || '—'}
            </p>
          </div>
          <span className="text-[10px] text-gray-600 font-mono shrink-0">{formatTime(event.timestamp)}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function EventTicker({ events = [] }) {
  if (events.length === 0) return null;
  const items = [...events, ...events];

  return (
    <div className="overflow-hidden border-y border-white/[0.06] bg-black/20 py-2">
      <div className="flex animate-ticker whitespace-nowrap gap-8">
        {items.map((e, i) => (
          <span key={`${e.id}-${i}`} className="text-xs font-mono text-gray-500 inline-flex items-center gap-2">
            <span className="text-soc-accent">{e.eventType}</span>
            <span className="text-gray-600">|</span>
            <span>{e.severity}</span>
            <span className="text-gray-600">|</span>
            <span>{e.ip || '—'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
