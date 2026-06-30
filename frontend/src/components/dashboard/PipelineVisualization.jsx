import { Activity, Bell, FolderKanban, FileText } from 'lucide-react';

const STEPS = [
  { id: 'events', label: 'Live Events', icon: Activity, color: 'text-cyan-400' },
  { id: 'detection', label: 'Detection Engine', icon: Activity, color: 'text-purple-400' },
  { id: 'alerts', label: 'Alerts', icon: Bell, color: 'text-amber-400' },
  { id: 'incidents', label: 'Incidents', icon: FolderKanban, color: 'text-orange-400' },
  { id: 'ai', label: 'AI Investigation', icon: Activity, color: 'text-soc-accent' },
  { id: 'report', label: 'SOC Report', icon: FileText, color: 'text-emerald-400' },
];

export default function PipelineVisualization({ active = false }) {
  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            <div
              className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl border transition-all ${
                active
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-transparent opacity-60'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-black/30 border border-white/[0.06] flex items-center justify-center ${active ? 'shadow-glow-cyan' : ''}`}>
                <Icon className={`w-4 h-4 ${step.color} ${active && i === 0 ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-[9px] text-gray-500 text-center max-w-[56px] leading-tight">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${active ? 'bg-gradient-to-r from-soc-accent/50 to-transparent' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
