import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, FileSearch, Target, ShieldCheck, FileText, CheckCircle2,
  ChevronRight, Loader2, AlertTriangle, Clock,
} from 'lucide-react';
import { AGENT_DESCRIPTIONS, AGENT_LABELS, WORKFLOW_AGENTS } from '../../utils/agents';
import ExplainableEvidencePanel from './ExplainableEvidencePanel';
import ReportQualityPanel from '../reports/ReportQualityPanel';

const AGENT_ICONS = {
  triage: Search,
  investigation: FileSearch,
  classification: Target,
  mitigation: ShieldCheck,
  report: FileText,
  reviewer: CheckCircle2,
};

const statusConfig = {
  waiting: { border: 'border-white/10', bg: 'bg-white/[0.02]', text: 'text-gray-500', dot: 'bg-gray-600' },
  running: { border: 'border-soc-accent/40', bg: 'bg-soc-accent/5', text: 'text-soc-accent', dot: 'bg-soc-accent animate-pulse' },
  completed: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  failed: { border: 'border-red-500/40', bg: 'bg-red-500/5', text: 'text-red-300', dot: 'bg-red-400' },
};

function outputPreview(output) {
  if (!output) return null;
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 140 ? `${cleaned.slice(0, 140)}…` : cleaned;
}

function formatAgentTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function AgentStepCard({ agent, index, expanded, onToggle, isLast }) {
  const cfg = statusConfig[agent.status] || statusConfig.waiting;
  const Icon = AGENT_ICONS[agent.agentName] || Search;
  const label = AGENT_LABELS[agent.agentName] || agent.agentName;
  const description = AGENT_DESCRIPTIONS[agent.agentName] || '';
  const preview = agent.status === 'completed' ? outputPreview(agent.output) : null;
  const timestamp = formatAgentTime(agent.completedAt || agent.startedAt || agent.createdAt);

  return (
    <div className="relative flex gap-4">
      {!isLast && <div className="absolute left-[22px] top-12 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />}
      <div className="relative z-10 shrink-0">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${cfg.border} ${cfg.bg} ${agent.status === 'running' ? 'agent-scan overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.25)]' : ''}`}>
          {agent.status === 'running' ? (
            <Loader2 className="w-5 h-5 text-soc-accent animate-spin" />
          ) : agent.status === 'failed' ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : (
            <Icon className={`w-5 h-5 ${cfg.text}`} />
          )}
        </div>
      </div>
      <motion.div layout className={`flex-1 rounded-xl border p-4 mb-4 ${cfg.border} ${cfg.bg}`}>
        <button type="button" onClick={onToggle} className="w-full text-left" disabled={!agent.output && !agent.error}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-gray-600">AGENT {String(index + 1).padStart(2, '0')}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                {timestamp && (
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timestamp}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white mt-1">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs capitalize font-medium ${cfg.text}`}>{agent.status}</span>
              {(agent.output || agent.error) && (
                <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              )}
            </div>
          </div>
          {agent.confidence != null && agent.status === 'completed' && (
            <p className="text-xs text-gray-500 mt-2">
              Confidence: <span className="text-soc-accent font-mono">{Math.round(agent.confidence * 100)}%</span>
            </p>
          )}
          {preview && !expanded && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{preview}</p>
          )}
          {agent.error && (
            <p className="text-xs text-red-300 mt-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {agent.error}
            </p>
          )}
        </button>
        {expanded && agent.output && (
          <div className="mt-3 space-y-3">
            {(agent.agentName === 'investigation' || agent.agentName === 'classification') && (
              <ExplainableEvidencePanel agentOutput={agent.output} />
            )}
            {agent.agentName === 'reviewer' && agent.output?.reportQuality && (
              <ReportQualityPanel quality={agent.output.reportQuality} />
            )}
            <pre className="p-3 rounded-lg bg-black/30 border border-white/[0.06] text-xs text-gray-400 overflow-x-auto max-h-52 font-mono leading-relaxed">
              {typeof agent.output === 'string' ? agent.output : JSON.stringify(agent.output, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AgentWorkflow({ outputs = [], showAllAgents = true }) {
  const [expandedId, setExpandedId] = useState(null);
  const outputMap = Object.fromEntries(outputs.map((o) => [o.agentName, o]));
  const agents = showAllAgents
    ? WORKFLOW_AGENTS.map((name) => outputMap[name] || { agentName: name, status: 'waiting' })
    : outputs.length > 0
      ? outputs
      : WORKFLOW_AGENTS.map((name) => ({ agentName: name, status: 'waiting' }));

  if (!showAllAgents && outputs.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        Launch AI investigation to activate the multi-agent pipeline.
      </p>
    );
  }

  const runningIdx = agents.findIndex((a) => a.status === 'running');
  const allWaiting = agents.every((a) => a.status === 'waiting');

  return (
    <div>
      {allWaiting && (
        <p className="text-xs text-gray-600 mb-4 text-center">
          Triage Agent → Investigation Agent → Threat Classification → Mitigation → Report → Reviewer
        </p>
      )}
      {runningIdx >= 0 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-soc-accent/10 border border-soc-accent/20 text-xs text-soc-accent flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Pipeline active — {AGENT_LABELS[agents[runningIdx].agentName]}
        </div>
      )}
      {agents.map((agent, i) => (
        <AgentStepCard
          key={agent.agentName}
          agent={agent}
          index={i}
          isLast={i === agents.length - 1}
          expanded={expandedId === agent.agentName}
          onToggle={() => setExpandedId((prev) => (prev === agent.agentName ? null : agent.agentName))}
        />
      ))}
    </div>
  );
}
