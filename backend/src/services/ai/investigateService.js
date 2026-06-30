import AgentOutput from '../../models/AgentOutput.js';
import Incident from '../../models/Incident.js';
import { WORKFLOW_AGENTS } from '../../config/agents.js';
import { requestInvestigationWorkflow } from '../ai/aiClient.js';
import {
  loadIncidentBundle,
  toAiServiceContext,
  toIncidentDetailJson,
} from '../incident/incidentLoader.js';
import { syncPlaybookActionsFromRecommendations } from '../playbook/playbookService.js';
import { buildReportForIncident } from '../reports/reportBuilder.js';

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
    const workflowResult = await requestInvestigationWorkflow(context);

    await applyWorkflowResults(incidentId, workflowResult);

    const reportAgent = workflowResult.agents.find((a) => a.agent_name === 'report');
    const reviewAgent = workflowResult.agents.find((a) => a.agent_name === 'reviewer');

    incident.aiSummary = workflowResult.summary;
    incident.threatClassification = {
      attackType: workflowResult.threat_classification?.attackType,
      category: workflowResult.threat_classification?.category,
      confidence: workflowResult.threat_classification?.confidence,
    };
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
      aiSource: workflowResult.source,
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
