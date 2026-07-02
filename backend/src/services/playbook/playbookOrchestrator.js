import { randomUUID } from 'crypto';
import Incident from '../../models/Incident.js';
import PlaybookAction from '../../models/PlaybookAction.js';
import PlaybookTemplate from '../../models/PlaybookTemplate.js';
import { PLAYBOOK_ACTION_TYPES } from '../../config/constants.js';
import { recordAudit } from './auditService.js';
import { notifyUser } from '../notifications/notificationService.js';
import { assertDocumentOwner } from '../../utils/ownerScope.js';

const DEFAULT_TEMPLATES = [
  {
    name: 'Account Compromise Response',
    description: 'Lock account, reset credentials, and notify user after suspected compromise.',
    category: 'credential_access',
    triggerRules: ['suspicious_login_v1', 'brute_force_v1'],
    isSystem: true,
    steps: [
      { actionType: 'lock_account', description: 'Temporarily lock affected account', priority: 'high' },
      { actionType: 'force_password_reset', description: 'Force password reset and MFA enrollment', priority: 'high' },
      { actionType: 'notify_user', description: 'Notify user of security activity', priority: 'medium' },
    ],
  },
  {
    name: 'Data Exfiltration Containment',
    description: 'Block source IP and isolate host when exfiltration is detected.',
    category: 'exfiltration',
    triggerRules: ['data_exfil_v1'],
    isSystem: true,
    steps: [
      { actionType: 'block_ip', description: 'Block suspicious source IP at network edge', priority: 'high' },
      { actionType: 'isolate_host', description: 'Isolate affected endpoint from network', priority: 'high' },
      { actionType: 'escalate', description: 'Escalate to Tier 2 for forensic review', priority: 'medium' },
    ],
  },
  {
    name: 'Reconnaissance Response',
    description: 'Block scanning IP and escalate for threat hunting.',
    category: 'discovery',
    triggerRules: ['port_scan_v1'],
    isSystem: true,
    steps: [
      { actionType: 'block_ip', description: 'Block reconnaissance source IP', priority: 'medium' },
      { actionType: 'escalate', description: 'Escalate for threat hunting review', priority: 'medium' },
    ],
  },
];

function buildTarget(incident, actionType) {
  const target = {};
  if (['lock_account', 'force_password_reset', 'notify_user'].includes(actionType)) {
    target.username = incident.username;
  }
  if (['block_ip', 'isolate_host'].includes(actionType)) {
    target.ip = incident.ip;
  }
  return target;
}

export async function ensurePlaybookTemplates() {
  for (const template of DEFAULT_TEMPLATES) {
    await PlaybookTemplate.findOneAndUpdate(
      { name: template.name },
      { $setOnInsert: template },
      { upsert: true }
    );
  }
}

export async function listPlaybookTemplates() {
  await ensurePlaybookTemplates();
  return PlaybookTemplate.find({ enabled: true }).sort({ name: 1 });
}

export async function getPlaybookTemplate(templateId) {
  const template = await PlaybookTemplate.findById(templateId);
  if (!template) {
    const err = new Error('Playbook template not found');
    err.status = 404;
    throw err;
  }
  return template;
}

export async function createManualPlaybookAction(incidentId, user, { actionType, description, priority }) {
  if (!PLAYBOOK_ACTION_TYPES.includes(actionType)) {
    const err = new Error(`Invalid action type: ${actionType}`);
    err.status = 400;
    throw err;
  }

  const incident = await Incident.findById(incidentId);
  assertDocumentOwner(incident, user._id);

  const action = await PlaybookAction.create({
    userId: incident.userId,
    incidentId: incident._id,
    actionType,
    description,
    justification: 'Manually created by analyst',
    priority: priority || 'medium',
    status: 'pending',
    source: 'manual',
    target: buildTarget(incident, actionType),
  });

  await recordAudit({
    action: 'playbook_created',
    entityType: 'playbook_action',
    entityId: action._id,
    incidentId: incident._id,
    user,
    details: { actionType, description, source: 'manual' },
  });

  await notifyUser(incident.userId, {
    type: 'playbook_pending',
    title: 'Playbook action pending approval',
    message: `${actionType.replace(/_/g, ' ')} — ${description}`,
    link: `/incidents/${incident._id}?tab=playbook`,
    metadata: { incidentId: incident._id, actionId: action._id },
  });

  return action;
}

export async function runPlaybookTemplate(incidentId, templateId, user) {
  const incident = await Incident.findById(incidentId);
  assertDocumentOwner(incident, user._id);

  const template = await getPlaybookTemplate(templateId);
  if (!template.steps?.length) {
    const err = new Error('Playbook template has no steps');
    err.status = 400;
    throw err;
  }

  const playbookRunId = randomUUID();
  const created = [];

  for (let i = 0; i < template.steps.length; i += 1) {
    const step = template.steps[i];
    const action = await PlaybookAction.create({
      userId: incident.userId,
      incidentId: incident._id,
      actionType: step.actionType,
      description: step.description,
      justification: `Step ${i + 1} of playbook "${template.name}"`,
      priority: step.priority || 'medium',
      status: 'pending',
      source: 'playbook_template',
      playbookRunId,
      stepOrder: i + 1,
      templateId: template._id,
      templateName: template.name,
      target: buildTarget(incident, step.actionType),
    });
    created.push(action);

    await recordAudit({
      action: 'playbook_created',
      entityType: 'playbook_action',
      entityId: action._id,
      incidentId: incident._id,
      user,
      details: {
        actionType: step.actionType,
        templateName: template.name,
        stepOrder: i + 1,
        playbookRunId,
      },
    });
  }

  await recordAudit({
    action: 'playbook_template_run',
    entityType: 'playbook_template',
    entityId: template._id,
    incidentId: incident._id,
    user,
    details: { templateName: template.name, stepCount: created.length, playbookRunId },
  });

  await notifyUser(incident.userId, {
    type: 'playbook_pending',
    title: `Playbook started: ${template.name}`,
    message: `${created.length} actions queued for analyst approval`,
    link: `/incidents/${incident._id}?tab=playbook`,
    metadata: { incidentId: incident._id, playbookRunId, templateId: template._id },
  });

  return { template, actions: created, playbookRunId };
}

export function suggestTemplatesForIncident(incident, templates) {
  const ruleIds = incident.correlation?.ruleIds || [];
  return templates.filter((t) =>
    t.triggerRules?.some((ruleId) => ruleIds.includes(ruleId))
  );
}
