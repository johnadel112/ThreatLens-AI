import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getIncident, getAgentOutputs, updateIncident, investigateIncident, generateIncidentReport } from '../api/incidents';
import { getPlaybookActions, approvePlaybookAction, rejectPlaybookAction, executePlaybookAction, getAuditLog, getPlaybookTemplates, runPlaybookTemplate } from '../api/playbooks';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import Timeline from '../components/incidents/Timeline';
import AgentWorkflow from '../components/agents/AgentWorkflow';
import GlassCard from '../components/ui/GlassCard';
import AISummaryPanel from '../components/incidents/AISummaryPanel';
import PlaybookPanel from '../components/incidents/PlaybookPanel';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import SOCReportViewer from '../components/reports/SOCReportViewer';
import ExplainableEvidencePanel from '../components/agents/ExplainableEvidencePanel';
import ReportQualityPanel, { hasReportQualityData } from '../components/reports/ReportQualityPanel';
import CorrelationPanel from '../components/incidents/CorrelationPanel';
import ThreatIntelCard from '../components/ui/ThreatIntelCard';
import RiskScoreBadge from '../components/ui/RiskScoreBadge';
import MitreTechniqueBadge from '../components/ui/MitreTechniqueBadge';
import CaseNotesPanel from '../components/incidents/CaseNotesPanel';
import CaseTasksPanel from '../components/incidents/CaseTasksPanel';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { FileText, Loader2 } from 'lucide-react';
import { PERMISSIONS } from '../utils/permissions';

const INCIDENT_STATUSES = ['new', 'investigating', 'contained', 'resolved', 'closed'];
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'correlation', label: 'Correlation' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'case', label: 'Case Management' },
  { id: 'ai', label: 'AI Investigation' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'report', label: 'SOC Report' },
];

export default function IncidentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, can } = useAuth();
  const canUpdateCase = can(PERMISSIONS.CASES_UPDATE);
  const canInvestigate = can(PERMISSIONS.AI_INVESTIGATE);
  const canGenerateReport = can(PERMISSIONS.REPORTS_GENERATE);
  const canApprovePlaybooks = can(PERMISSIONS.PLAYBOOKS_APPROVE);
  const canRequestPlaybooks = can(PERMISSIONS.PLAYBOOKS_REQUEST);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [playbookActions, setPlaybookActions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [playbookTemplates, setPlaybookTemplates] = useState([]);
  const [playbooksLoading, setPlaybooksLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const fetchIncident = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getIncident(id);
      setIncident(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const fetchPlaybooks = useCallback(async () => {
    try {
      const [playbookData, auditData, templateData] = await Promise.all([
        getPlaybookActions(id),
        getAuditLog(id),
        getPlaybookTemplates(),
      ]);
      setPlaybookActions(playbookData.actions || []);
      setAuditLogs(auditData.logs || []);
      setPlaybookTemplates(templateData.templates || []);
    } catch {
      // ignore — playbooks optional until investigation
    } finally {
      setPlaybooksLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  const pollAgents = useCallback(async () => {
    if (incident?.investigationStatus !== 'running' && !investigating) return;
    try {
      const data = await getAgentOutputs(id);
      setIncident((prev) => prev ? { ...prev, agentOutputs: data.agentOutputs } : prev);
    } catch {
      // ignore poll errors
    }
  }, [id, incident?.investigationStatus, investigating]);

  usePolling(pollAgents, 2000, incident?.investigationStatus === 'running' || investigating);

  async function handleStatusChange(status) {
    try {
      const updated = await updateIncident(id, { status });
      setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }));
      setActionMsg(`Status updated to ${status}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleAssignToMe() {
    try {
      const updated = await updateIncident(id, { assignedAnalystId: user.id });
      setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }));
      setActionMsg('Incident assigned to you');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign incident');
    }
  }

  async function handleInvestigate() {
    setInvestigating(true);
    setError('');
    setActionMsg('');
    toast.loading('AI investigation started…', { id: 'investigate' });

    try {
      const data = await investigateIncident(id);
      setIncident(data.incident);
      setActionMsg(
        data.usedFallback
          ? 'Investigation complete using evidence-based analysis (AI service offline)'
          : `Multi-agent investigation complete — ${data.agentOutputs?.length || 6} agents (${data.aiSource === 'openai' ? 'LLM' : 'evidence-based'})`
      );
      toast.success('AI investigation completed', { id: 'investigate' });
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      const msg = err.response?.data?.error || 'Investigation failed. Please try again.';
      setError(msg);
      toast.error(msg, { id: 'investigate' });
      await fetchIncident();
    } finally {
      setInvestigating(false);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    setError('');
    setActionMsg('');
    toast.loading('Generating SOC report…', { id: 'report' });

    try {
      const report = await generateIncidentReport(id);
      setIncident((prev) => ({
        ...prev,
        report: {
          markdown: report.markdown,
          generatedAt: report.generatedAt,
          version: report.version,
          title: report.title,
          severity: report.severity,
          status: report.status,
        },
      }));
      setActionMsg(`SOC report generated (v${report.version})`);
      toast.success('SOC report generated', { id: 'report' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate SOC report';
      setError(msg);
      toast.error(msg, { id: 'report' });
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleApprovePlaybook(actionId) {
    try {
      await approvePlaybookAction(actionId);
      setActionMsg('Playbook action approved');
      toast.success('Playbook action approved');
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to approve action';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleRejectPlaybook(actionId) {
    try {
      await rejectPlaybookAction(actionId, 'Declined by analyst');
      setActionMsg('Playbook action rejected');
      toast.success('Playbook action rejected');
      await fetchPlaybooks();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reject action';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleRunTemplate(templateId) {
    try {
      const data = await runPlaybookTemplate(id, templateId);
      toast.success(data.message || 'Playbook started');
      await fetchPlaybooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to run playbook');
    }
  }

  async function handleExecutePlaybook(actionId) {
    try {
      const data = await executePlaybookAction(actionId);
      setActionMsg(data.message || 'Playbook executed (simulated)');
      toast.success('Playbook action executed (simulated)');
      await fetchPlaybooks();
      await fetchIncident();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to execute action';
      setError(msg);
      toast.error(msg);
    }
  }

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (error && !incident) {
    return (
      <div>
        <p className="text-red-300">{error}</p>
        <Link to="/incidents" className="text-soc-accent text-sm mt-2 inline-block hover:underline">
          ← Back to cases
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/incidents" className="text-sm text-soc-accent hover:underline mb-4 inline-block">
        ← Back to cases
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{incident.title}</h2>
            {incident.caseNumber && (
              <code className="text-xs text-soc-accent font-mono px-2 py-0.5 rounded border border-soc-accent/20 bg-soc-accent/5">
                {incident.caseNumber}
              </code>
            )}
            <SeverityBadge severity={incident.severity} />
            {incident.riskScore != null && <RiskScoreBadge score={incident.riskScore} />}
            {incident.mitre?.primaryTactic && (
              <MitreTechniqueBadge tactic={incident.mitre.primaryTactic} compact />
            )}
            <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium border capitalize bg-soc-surface border-soc-border text-gray-300">
              {incident.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {incident.priority && <span>Priority: <span className="text-white">{incident.priority}</span></span>}
            {incident.slaDueAt && (
              <span>SLA: <span className="text-amber-300">{new Date(incident.slaDueAt).toLocaleString()}</span></span>
            )}
            {incident.username && <span>User: {incident.username}</span>}
            {incident.ip && <span>IP: <code>{incident.ip}</code></span>}
            {incident.assignedAnalyst && (
              <span>Analyst: {incident.assignedAnalyst.name}</span>
            )}
          </div>
        </div>

        {(canUpdateCase || canInvestigate || canGenerateReport) && (
          <div className="flex flex-wrap gap-2">
            {canUpdateCase && (
              <button
                type="button"
                onClick={handleAssignToMe}
                className="px-3 py-2 rounded-lg text-xs border border-soc-border text-gray-300 hover:text-white"
              >
                Assign to me
              </button>
            )}
            {canInvestigate && (
              <button
                type="button"
                onClick={handleInvestigate}
                disabled={investigating}
                className="btn-primary text-xs py-2"
              >
                {investigating ? 'Investigating…' : 'Investigate with AI'}
              </button>
            )}
            {canGenerateReport && (
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={generatingReport || incident.investigationStatus !== 'completed'}
                className="btn-ghost text-xs py-2"
                title={incident.investigationStatus !== 'completed' ? 'Complete AI investigation first' : ''}
              >
                {generatingReport ? 'Generating…' : 'Generate SOC Report'}
              </button>
            )}
            {canUpdateCase && INCIDENT_STATUSES.filter((s) => s !== incident.status).slice(0, 2).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className="px-3 py-2 rounded-lg text-xs border border-soc-border text-gray-400 hover:text-white capitalize"
              >
                Mark {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-accent/10 border border-soc-accent/30 text-soc-accent text-sm">
          {actionMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto mb-6 pb-1 border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-soc-accent border-b-2 border-soc-accent bg-soc-accent/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">AI Investigation Summary</h3>
            <AISummaryPanel incident={incident} onRetry={canInvestigate ? handleInvestigate : undefined} />
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Explainable AI Evidence</h3>
            <ExplainableEvidencePanel explainability={incident.aiExplainability} />
          </GlassCard>
          {hasReportQualityData(incident.reportQuality) && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">Report Quality Assessment</h3>
              <ReportQualityPanel quality={incident.reportQuality} />
            </GlassCard>
          )}
          {incident.threatIntel?.ip && (
            <ThreatIntelCard intel={incident.threatIntel} />
          )}
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Related Alerts ({incident.alerts?.length || 0})</h3>
            <div className="space-y-3">
              {(incident.alerts || []).map((alert) => (
                <div key={alert.id} className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm text-white font-medium">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} />
                    <StatusBadge status={alert.status} />
                    {alert.riskScore != null && <RiskScoreBadge score={alert.riskScore} showLabel={false} />}
                    {alert.mitre?.techniqueId && (
                      <MitreTechniqueBadge tactic={alert.mitre.tactic} techniqueId={alert.mitre.techniqueId} compact />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{alert.evidence?.summary}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Events</dt><dd className="text-white">{incident.events?.length || 0}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Alerts</dt><dd className="text-white">{incident.alerts?.length || 0}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Correlation</dt><dd className="text-soc-accent font-mono">{incident.correlationScore ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Confidence</dt><dd className="text-emerald-300 font-mono">{incident.confidenceScore != null ? `${incident.confidenceScore}%` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Investigation</dt><dd className="text-soc-accent capitalize">{incident.investigationStatus?.replace(/_/g, ' ') || 'not started'}</dd></div>
          </dl>
        </GlassCard>
      </div>
      )}

      {activeTab === 'correlation' && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Correlation Analysis</h3>
          <CorrelationPanel
            correlation={incident.correlation}
            correlationScore={incident.correlationScore}
            mitre={incident.mitre}
          />
          {incident.threatIntel?.ip && (
            <div className="mt-6">
              <ThreatIntelCard intel={incident.threatIntel} />
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'timeline' && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Case Timeline</h3>
          <Timeline entries={incident.timeline} />
        </GlassCard>
      )}

      {activeTab === 'evidence' && (
        <GlassCard padding={false} className="overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Related Events ({incident.events?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Type</th><th>User</th><th>IP</th><th>Severity</th></tr></thead>
              <tbody>
                {(incident.events || []).map((event) => (
                  <tr key={event.id}>
                    <td className="text-gray-400 text-xs font-mono">{new Date(event.timestamp).toLocaleString()}</td>
                    <td><code className="text-xs text-soc-accent font-mono">{event.eventType}</code></td>
                    <td className="text-gray-300">{event.username || '—'}</td>
                    <td className="text-gray-400 font-mono text-xs">{event.ip || '—'}</td>
                    <td><SeverityBadge severity={event.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === 'case' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Analyst Notes</h3>
            <CaseNotesPanel
              incident={incident}
              canEdit={canUpdateCase}
              onUpdated={(updated) => setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }))}
            />
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Case Tasks</h3>
            <CaseTasksPanel
              incident={incident}
              canEdit={canUpdateCase}
              onUpdated={(updated) => setIncident((prev) => ({ ...prev, ...updated, alerts: prev.alerts, events: prev.events, agentOutputs: prev.agentOutputs }))}
            />
          </GlassCard>
        </div>
      )}

      {activeTab === 'ai' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Multi-Agent Investigation Pipeline</h3>
            <Link to={`/incidents/${id}/agents`} className="text-xs text-soc-accent hover:underline">Full view →</Link>
          </div>
          {investigating || incident.investigationStatus === 'running' ? (
            <div className="mb-4 px-3 py-2 rounded-lg bg-soc-accent/10 border border-soc-accent/20 text-xs text-soc-accent flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              AI investigation in progress…
            </div>
          ) : incident.investigationStatus === 'failed' ? (
            <EmptyState
              title="Investigation failed"
              description="The AI pipeline could not complete. Check that the AI service is running and try again."
            />
          ) : null}
          <AgentWorkflow outputs={incident.agentOutputs} showAllAgents />
        </GlassCard>
      )}

      {activeTab === 'playbook' && (
        <div className="space-y-6">
          {canRequestPlaybooks && playbookTemplates.length > 0 && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-2">Response Playbook Templates</h3>
              <p className="text-xs text-gray-500 mb-4">Request a multi-step SOAR playbook — each step requires admin approval before execution.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playbookTemplates.map((template) => (
                  <div key={template.id} className="p-4 rounded-xl border border-white/[0.06] bg-black/20">
                    <p className="text-sm font-medium text-white">{template.name}</p>
                    <p className="text-xs text-gray-500 mt-1 mb-3">{template.description}</p>
                    <p className="text-[10px] text-gray-600 mb-3">{template.stepCount} steps</p>
                    <button type="button" onClick={() => handleRunTemplate(template.id)} className="btn-primary text-xs py-1.5">
                      Run Playbook
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-2">Mitigation Playbook</h3>
            <p className="text-xs text-gray-500 mb-4">AI-recommended actions require admin approval before simulated execution.</p>
            <PlaybookPanel
              actions={playbookActions}
              auditLogs={auditLogs}
              incidentId={id}
              canApprove={canApprovePlaybooks}
              loading={playbooksLoading}
              onApprove={handleApprovePlaybook}
              onReject={handleRejectPlaybook}
              onExecute={handleExecutePlaybook}
            />
          </GlassCard>
        </div>
      )}

      {activeTab === 'report' && (
        <div>
          {generatingReport && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-soc-accent/10 border border-soc-accent/20 text-xs text-soc-accent flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating SOC report…
            </div>
          )}
          {incident.report?.markdown ? (
            <>
              <div className="mb-4 flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() =>
                    downloadMarkdownReport({
                      title: incident.report.title || incident.title,
                      markdown: incident.report.markdown,
                      incidentId: id,
                      severity: incident.severity,
                      generatedAt: incident.report.generatedAt,
                      version: incident.report.version,
                    })
                  }
                  className="btn-ghost text-sm py-2"
                >
                  Download Markdown
                </button>
                <button type="button" onClick={printReport} className="btn-primary text-sm py-2">
                  Print / Save PDF
                </button>
              </div>
              <div id="report-content">
                <SOCReportViewer
                  report={{
                    title: incident.report.title || `SOC Report — ${incident.title}`,
                    markdown: incident.report.markdown,
                    incidentId: id,
                    severity: incident.severity,
                    status: incident.report.status || incident.status,
                    generatedAt: incident.report.generatedAt,
                    version: incident.report.version,
                    threatClassification: incident.threatClassification,
                  }}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title="Report not generated yet"
              description={
                incident.investigationStatus === 'completed'
                  ? 'Complete the investigation summary above, then generate a SOC report.'
                  : 'Complete AI investigation first, then generate a professional SOC report.'
              }
            />
          )}
        </div>
      )}

    </div>
  );
}
