import {
  Bell, FolderKanban, Shield, UserCheck, Zap,
} from 'lucide-react';

const TYPE_CONFIG = {
  incident_created: {
    icon: FolderKanban,
    label: 'New Case',
    accent: 'text-amber-300',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  incident_assigned: {
    icon: UserCheck,
    label: 'Assignment',
    accent: 'text-soc-accent',
    border: 'border-soc-accent/30',
    bg: 'bg-soc-accent/10',
  },
  playbook_pending: {
    icon: Shield,
    label: 'SOAR',
    accent: 'text-purple-300',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
  playbook_executed: {
    icon: Shield,
    label: 'SOAR',
    accent: 'text-emerald-300',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  rule_updated: {
    icon: Zap,
    label: 'Rules',
    accent: 'text-blue-300',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
  },
  rule_enabled: {
    icon: Zap,
    label: 'Rules',
    accent: 'text-emerald-300',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  rule_disabled: {
    icon: Zap,
    label: 'Rules',
    accent: 'text-gray-400',
    border: 'border-gray-500/30',
    bg: 'bg-gray-500/10',
  },
  case_note_added: {
    icon: Bell,
    label: 'Case',
    accent: 'text-gray-300',
    border: 'border-white/10',
    bg: 'bg-white/5',
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  label: 'Alert',
  accent: 'text-soc-accent',
  border: 'border-soc-accent/30',
  bg: 'bg-soc-accent/10',
};

export function getNotificationConfig(type) {
  return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

export function formatNotificationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleString();
}
