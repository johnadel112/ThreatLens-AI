import { Globe, ShieldAlert } from 'lucide-react';

const REP_STYLES = {
  malicious: 'text-red-300 border-red-500/30 bg-red-500/10',
  suspicious: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  benign: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  unknown: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
};

export default function ThreatIntelCard({ intel, title = 'Threat Intelligence' }) {
  const ip = intel?.ip || intel;
  if (!ip?.ip && !ip?.reputation) return null;

  const reputation = ip.reputation || 'unknown';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-4 h-4 text-soc-accent" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-[10px] text-gray-600 uppercase tracking-wide ml-auto">Simulated</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <code className="text-sm text-soc-accent font-mono">{ip.ip}</code>
        <span className={`text-xs px-2 py-0.5 rounded-md border capitalize ${REP_STYLES[reputation]}`}>
          {reputation}
        </span>
        {ip.confidence != null && (
          <span className="text-xs text-gray-500">{ip.confidence}% confidence</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {(ip.city || ip.country) && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Globe className="w-3.5 h-3.5" />
            {[ip.city, ip.country].filter(Boolean).join(', ')}
          </div>
        )}
        {ip.asn && <div className="text-gray-500 truncate" title={ip.asn}>{ip.asn}</div>}
      </div>

      {ip.knownFor?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ip.knownFor.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.06]">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
