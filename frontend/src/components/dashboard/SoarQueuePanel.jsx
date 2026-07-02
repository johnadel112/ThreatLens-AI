import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function SoarQueuePanel({ pending = 0, executed = 0 }) {
  if (!pending && !executed) {
    return (
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-2">SOAR Actions</h3>
        <p className="text-sm text-gray-500">No playbook actions in queue.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-300" />
          SOAR Actions
        </h3>
        <Link to="/playbooks" className="text-xs text-soc-accent hover:underline min-h-[44px] inline-flex items-center">
          Open queue
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] uppercase tracking-wide text-amber-300/80">Awaiting approval</p>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{pending}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[10px] uppercase tracking-wide text-emerald-300/80">Executed</p>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{executed}</p>
        </div>
      </div>
    </GlassCard>
  );
}
