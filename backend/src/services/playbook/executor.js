const SIMULATED_MESSAGES = {
  lock_account: (target) =>
    `[SIMULATED] Account "${target.username || 'unknown'}" locked in identity provider.`,
  block_ip: (target) =>
    `[SIMULATED] IP ${target.ip || 'unknown'} added to perimeter deny list.`,
  force_password_reset: (target) =>
    `[SIMULATED] Password reset initiated for "${target.username || 'unknown'}" with MFA enrollment prompt.`,
  isolate_host: (target) =>
    `[SIMULATED] Host associated with ${target.ip || 'unknown'} moved to quarantine VLAN.`,
  notify_user: (target) =>
    `[SIMULATED] Security notification sent to "${target.username || 'unknown'}".`,
  escalate: () =>
    '[SIMULATED] Incident escalated to Tier-2 SOC queue.',
};

export function executePlaybookAction(action) {
  const messageFn = SIMULATED_MESSAGES[action.actionType];
  const message = messageFn
    ? messageFn(action.target || {})
    : `[SIMULATED] Action "${action.actionType}" completed.`;

  return {
    success: true,
    message,
    simulatedAt: new Date(),
    details: {
      actionType: action.actionType,
      target: action.target,
      note: 'No real systems were modified — simulation only.',
    },
  };
}
