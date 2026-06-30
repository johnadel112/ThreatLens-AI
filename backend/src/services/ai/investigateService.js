import AgentOutput from '../../models/AgentOutput.js';
import Incident from '../../models/Incident.js';
import { requestIncidentSummary } from '../ai/aiClient.js';
import {
  loadIncidentBundle,
  toAiServiceContext,
  toIncidentDetailJson,
} from '../incident/incidentLoader.js';

export async function runBasicInvestigation(incidentId) {
  const bundle = await loadIncidentBundle(incidentId);
  if (!bundle) {
    const err = new Error('Incident not found');
    err.status = 404;
    throw err;
  }

  const { incident, alerts, events } = bundle;

  incident.investigationStatus = 'running';
  if (incident.status === 'new') {
    incident.status = 'investigating';
  }
  await incident.save();

  let agentOutput = await AgentOutput.findOne({ incidentId, agentName: 'summary' });

  if (!agentOutput) {
    agentOutput = await AgentOutput.create({
      incidentId,
      agentName: 'summary',
      status: 'running',
      startedAt: new Date(),
    });
  } else {
    agentOutput.status = 'running';
    agentOutput.startedAt = new Date();
    agentOutput.error = undefined;
    await agentOutput.save();
  }

  try {
    const context = toAiServiceContext(incident, alerts, events);
    const result = await requestIncidentSummary(context);

    agentOutput.status = 'completed';
    agentOutput.completedAt = new Date();
    agentOutput.confidence = result.confidence;
    agentOutput.output = {
      summary: result.summary,
      markdown: result.markdown,
      keyFindings: result.key_findings,
      threatClassification: result.threat_classification,
      recommendations: result.recommendations,
      source: result.source,
    };
    await agentOutput.save();

    incident.aiSummary = result.summary;
    incident.threatClassification = {
      attackType: result.threat_classification?.attackType,
      category: result.threat_classification?.category,
      confidence: result.threat_classification?.confidence ?? result.confidence,
    };
    incident.recommendations = (result.recommendations || []).map((r) => ({
      actionType: r.actionType,
      description: r.description,
      priority: r.priority || 'medium',
    }));
    incident.report = {
      markdown: result.markdown,
      generatedAt: new Date(),
      version: (incident.report?.version || 0) + 1,
    };
    incident.investigationStatus = 'completed';

    const timelineEntry = {
      timestamp: new Date(),
      source: 'agent',
      title: 'AI Investigation Summary',
      description: result.summary,
      refId: agentOutput._id,
    };
    incident.timeline = [...(incident.timeline || []), timelineEntry];
    await incident.save();

    const refreshed = await loadIncidentBundle(incidentId);
    const outputs = await AgentOutput.find({ incidentId }).sort({ createdAt: 1 });

    return {
      incident: toIncidentDetailJson(refreshed.incident, refreshed.alerts, refreshed.events, outputs),
      agentOutput: agentOutput.toPublicJSON(),
      aiSource: result.source,
    };
  } catch (err) {
    agentOutput.status = 'failed';
    agentOutput.error = err.message;
    agentOutput.completedAt = new Date();
    await agentOutput.save();

    incident.investigationStatus = 'failed';
    await incident.save();

    throw err;
  }
}

export async function getAgentOutputs(incidentId) {
  return AgentOutput.find({ incidentId }).sort({ createdAt: 1 });
}
