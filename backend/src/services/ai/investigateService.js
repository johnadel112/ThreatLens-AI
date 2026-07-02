import AgentOutput from '../../models/AgentOutput.js';
import Incident from '../../models/Incident.js';
import { WORKFLOW_AGENTS } from '../../config/agents.js';
import { requestInvestigationWorkflow, checkAiServiceHealth } from '../ai/aiClient.js';
import { runFallbackInvestigationWorkflow } from './fallbackWorkflow.service.js';
import {
  loadIncidentBundle,
  toAiServiceContext,
  toIncidentDetailJson,
} from '../incident/incidentLoader.js';
import { syncPlaybookActionsFromRecommendations } from '../playbook/playbookService.js';
import { buildReportForIncident } from '../reports/reportBuilder.js';
import { extractExplainability } from '../intelligence/reportQuality.service.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureWorkflowAgents(incidentId, userId) {
  for (const agentName of WORKFLOW_AGENTS) {
    await AgentOutput.findOneAndUpdate(
      { incidentId, agentName },
      {
        $setOnInsert: { incidentId, agentName, userId },
        $set: { status: 'waiting', error: undefined },
      },
      { upsert: true, new: true }
    );
  }
}

async function setAgentState(incidentId, agentName, update) {
  return AgentOutput.findOneAndUpdate(
    { incidentId, agentName },
    update,
    { new: true }
  );
}

async function applyWorkflowResults(incidentId, workflowResult) {
  for (const agent of workflowResult.agents) {
    await setAgentState(incidentId, agent.agent_name, {
      status: 'completed',
      output: agent.output,
      confidence: agent.confidence,
      completedAt: new Date(),
      error: undefined,
    });
    await sleep(150);
  }
}

function buildTimelineFromInvestigation(reportOutput, reviewerOutput) {
  const entries = [];
  if (reportOutput?.executiveSummary) {
    entries.push({
      timestamp: new Date(),
      source: 'agent',
      title: 'AI SOC Report Generated',
      description: reportOutput.executiveSummary,
    });
  }
  if (reviewerOutput?.warnings?.length) {
    entries.push({
      timestamp: new Date(),
      source: 'agent',
      title: 'Reviewer Warnings',
      description: reviewerOutput.warnings.join('; '),
    });
  }
  if (reviewerOutput?.reportQuality?.overallConfidence) {
    entries.push({
      timestamp: new Date(),
      source: 'agent',
      title: 'Report Quality Score',
      description: `Overall report confidence: ${reviewerOutput.reportQuality.overallConfidence}%`,
    });
  }
  return entries;
}

export async function runBasicInvestigation(incidentId, user) {
  const bundle = await loadIncidentBundle(incidentId);
  if (!bundle) {
    const err = new Error('Incident not found');
    err.status = 404;
    throw err;
  }

  const { incident, alerts, events } = bundle;
  const userId = incident.userId;

  await ensureWorkflowAgents(incidentId, userId);

  // Allow re-run if a previous investigation was interrupted (crash, timeout, etc.)
  if (incident.investigationStatus === 'running') {
    incident.investigationStatus = 'not_started';
  }

  incident.investigationStatus = 'running';
  if (incident.status === 'new') {
    incident.status = 'investigating';
  }
  await incident.save();

  for (const agentName of WORKFLOW_AGENTS) {
    await setAgentState(incidentId, agentName, {
      status: 'running',
      startedAt: new Date(),
      output: undefined,
      confidence: undefined,
      completedAt: undefined,
      error: undefined,
    });
  }

  try {
    const context = toAiServiceContext(incident, alerts, events);
    let workflowResult;
    let usedFallback = false;

    try {
      const health = await checkAiServiceHealth();
      if (!health?.ok) {
        throw new Error('AI service health check failed');
      }
      workflowResult = await requestInvestigationWorkflow(context);
    } catch (aiErr) {
      console.warn('[investigation] AI service unavailable — using evidence-based fallback:', aiErr.message);
      workflowResult = runFallbackInvestigationWorkflow(context);
      usedFallback = true;
    }

    await applyWorkflowResults(incidentId, workflowResult);

    const reportAgent = workflowResult.agents.find((a) => a.agent_name === 'report');
    const reviewAgent = workflowResult.agents.find((a) => a.agent_name === 'reviewer');

    incident.aiSummary = workflowResult.summary;
    incident.threatClassification = {
      attackType: workflowResult.threat_classification?.attackType,
      category: workflowResult.threat_classification?.category,
      mitreTactic: workflowResult.threat_classification?.mitreTactic,
      mitreTechnique: workflowResult.threat_classification?.mitreTechnique,
      techniqueId: workflowResult.threat_classification?.techniqueId,
      confidence: workflowResult.threat_classification?.confidence,
    };

    const agentOutputsForExtract = workflowResult.agents.map((a) => ({
      agentName: a.agent_name,
      output: a.output,
    }));
    incident.aiExplainability = extractExplainability(agentOutputsForExtract);
    if (workflowResult.knowledge_sources?.length) {
      incident.aiExplainability.knowledgeSources = [
        ...new Set([
          ...(incident.aiExplainability.knowledgeSources || []),
          ...workflowResult.knowledge_sources,
        ]),
      ];
    }

    if (workflowResult.report_quality) {
      const rq = workflowResult.report_quality;
      incident.reportQuality = {
        evidenceCompleteness: rq.evidence_completeness ?? rq.evidenceCompleteness,
        timelineQuality: rq.timeline_quality ?? rq.timelineQuality,
        threatClassificationConfidence: rq.threat_classification_confidence ?? rq.threatClassificationConfidence,
        mitigationQuality: rq.mitigation_quality ?? rq.mitigationQuality,
        reportClarity: rq.report_clarity ?? rq.reportClarity,
        overallConfidence: rq.overall_confidence ?? rq.overallConfidence,
        missingEvidence: rq.missing_evidence ?? rq.missingEvidence ?? [],
        warnings: rq.warnings ?? [],
      };
    } else if (reviewAgent?.output?.reportQuality) {
      incident.reportQuality = reviewAgent.output.reportQuality;
    }
    incident.recommendations = (workflowResult.recommendations || []).map((r) => ({
      actionType: r.actionType,
      description: r.description,
      priority: r.priority || 'medium',
    }));
    incident.report = {
      markdown: workflowResult.markdown,
      generatedAt: new Date(),
      version: (incident.report?.version || 0) + 1,
      generatedBy: user?._id,
    };
    incident.investigationStatus = 'completed';

    const timelineEntries = buildTimelineFromInvestigation(
      reportAgent?.output,
      reviewAgent?.output
    );
    incident.timeline = [...(incident.timeline || []), ...timelineEntries];
    await incident.save();

    const mitigationAgent = workflowResult.agents.find((a) => a.agent_name === 'mitigation');
    const mitigationActions = mitigationAgent?.output?.actions || workflowResult.recommendations || [];
    await syncPlaybookActionsFromRecommendations(incident, mitigationActions);

    if (user) {
      await buildReportForIncident(incidentId, user);
    }

    const refreshed = await loadIncidentBundle(incidentId);
    const outputs = await getAgentOutputs(incidentId);

    return {
      incident: toIncidentDetailJson(refreshed.incident, refreshed.alerts, refreshed.events, outputs),
      agentOutputs: outputs.map((o) => o.toPublicJSON()),
      aiSource: usedFallback ? 'fallback' : workflowResult.source,
      usedFallback,
    };
  } catch (err) {
    for (const agentName of WORKFLOW_AGENTS) {
      await setAgentState(incidentId, agentName, {
        status: 'failed',
        error: err.message,
        completedAt: new Date(),
      });
    }

    incident.investigationStatus = 'failed';
    await incident.save();
    throw err;
  }
}

export async function getAgentOutputs(incidentId) {
  const outputs = await AgentOutput.find({ incidentId }).sort({ createdAt: 1 });
  const order = [...WORKFLOW_AGENTS, 'summary'];
  return outputs.sort(
    (a, b) => order.indexOf(a.agentName) - order.indexOf(b.agentName)
  );
}
