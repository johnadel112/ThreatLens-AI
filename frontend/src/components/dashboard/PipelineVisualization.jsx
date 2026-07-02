import { Link } from 'react-router-dom';
import {
  Activity, Bell, FolderKanban, FileText, BrainCircuit, Radar,
} from 'lucide-react';

function formatCount(value) {
  const n = Number(value) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

const STEPS = [
  { id: 'events', label: 'Live Events', icon: Activity, color: 'text-cyan-400', href: '/events' },
  { id: 'detection', label: 'Detection Engine', icon: Radar, color: 'text-purple-400', href: '/rules' },
  { id: 'alerts', label: 'Alerts', icon: Bell, color: 'text-amber-400', href: '/alerts' },
  { id: 'cases', label: 'Cases', icon: FolderKanban, color: 'text-orange-400', href: '/incidents' },
  { id: 'ai', label: 'AI Investigation', icon: BrainCircuit, color: 'text-soc-accent', href: '/incidents' },
  { id: 'report', label: 'SOC Report', icon: FileText, color: 'text-emerald-400', href: '/reports' },
];

function stepMetric(step, pipeline = {}) {
  switch (step.id) {
    case 'events':
      return `${formatCount(pipeline.eventsProcessed)} processed`;
    case 'detection':
      return `${formatCount(pipeline.alertsGenerated)} alerts generated`;
    case 'alerts':
      return pipeline.alertsOpenCritical
        ? `${pipeline.alertsOpenCritical} critical open`
        : `${formatCount(pipeline.alertsOpen)} open`;
    case 'cases':
      return `${formatCount(pipeline.casesActive)} active`;
    case 'ai':
      return `${formatCount(pipeline.aiInvestigationsToday)} completed today`;
    case 'report':
      return `${formatCount(pipeline.reportsGeneratedToday)} generated`;
    default:
      return '';
  }
}

function StepCard({ step, active, metric, vertical = false }) {
  const Icon = step.icon;
  const body = (
    <div
      className={`flex ${vertical ? 'flex-row items-center gap-3 w-full p-3' : 'flex-col items-center gap-1.5 px-2 py-2'} rounded-xl border transition-all ${
        active ? 'border-white/10 bg-white/[0.03]' : 'border-transparent opacity-80'
      }`}
    >
      <div className={`${vertical ? 'w-10 h-10' : 'w-9 h-9'} rounded-lg bg-black/30 border border-white/[0.06] flex items-center justify-center shrink-0 ${active ? 'shadow-glow-cyan' : ''}`}>
        <Icon className={`w-4 h-4 ${step.color}`} />
      </div>
      <div className={vertical ? 'min-w-0 flex-1 text-left' : 'text-center'}>
        <p className={`${vertical ? 'text-sm' : 'text-[10px]'} text-white font-medium leading-tight`}>{step.label}</p>
        <p className={`${vertical ? 'text-xs' : 'text-[9px]'} text-gray-500 mt-0.5`}>{metric}</p>
      </div>
    </div>
  );

  return (
    <Link to={step.href} className={`block shrink-0 ${vertical ? 'w-full' : ''}`}>
      {body}
    </Link>
  );
}

export default function PipelineVisualization({ active = false, pipeline = {} }) {
  return (
    <>
      <div className="hidden lg:flex items-stretch justify-between gap-1 overflow-x-auto pb-1">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1 shrink-0 flex-1 min-w-[88px]">
            <StepCard step={step} active={active} metric={stepMetric(step, pipeline)} />
            {i < STEPS.length - 1 && (
              <div className={`w-3 h-px shrink-0 ${active ? 'bg-gradient-to-r from-soc-accent/50 to-transparent' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="lg:hidden space-y-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="relative">
            <StepCard step={step} active={active} metric={stepMetric(step, pipeline)} vertical />
            {i < STEPS.length - 1 && (
              <div className="ml-5 w-px h-3 bg-white/10" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
