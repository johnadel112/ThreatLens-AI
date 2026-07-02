import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SeverityBadge from '../ui/SeverityBadge';

const SEVERITY_DOT = {
  critical: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-gray-400',
  info: 'bg-blue-400',
};

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {events.slice(0, 12).map((event, i) => (
        <motion.div
          key={event.id}
          initial={i === 0 ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-soc-accent/20 transition-colors min-h-[56px]"
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

function EventPill({ event }) {
  const dot = SEVERITY_DOT[event.severity] || SEVERITY_DOT.low;
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="font-mono text-soc-accent">{event.eventType}</span>
      <span className="text-gray-600">·</span>
      <span className="capitalize text-gray-400">{event.severity}</span>
      <span className="text-gray-600">·</span>
      <span className="font-mono text-gray-500">{event.ip || '—'}</span>
      {event.timestamp && (
        <>
          <span className="text-gray-600 hidden sm:inline">·</span>
          <span className="text-gray-600 hidden sm:inline">{formatTime(event.timestamp)}</span>
        </>
      )}
    </span>
  );
}

export function EventTicker({ events = [] }) {
  if (events.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-black/20 py-2.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#030712] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#030712] to-transparent z-10" />
      <div className="overflow-x-auto scrollbar-hide px-2">
        <div className="flex gap-2 w-max min-w-full px-1">
          {events.slice(0, 12).map((e) => (
            <EventPill key={e.id} event={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
