import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { getDetectionRules, updateDetectionRule } from '../api/rules';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import GlassCard from '../components/ui/GlassCard';
import SeverityBadge from '../components/ui/SeverityBadge';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import { PERMISSIONS } from '../utils/permissions';
import MitreTechniqueBadge from '../components/ui/MitreTechniqueBadge';

export default function DetectionRules() {
  const { can } = useAuth();
  const canManageRules = can(PERMISSIONS.DETECTION_RULES_MANAGE);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDetectionRules();
      setRules(data.rules || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load detection rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  async function handleToggle(rule) {
    try {
      const data = await updateDetectionRule(rule.ruleId, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r.ruleId === rule.ruleId ? data.rule : r)));
      toast.success(`Rule ${data.rule.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update rule');
    }
  }

  async function handleThresholdChange(rule, threshold) {
    const value = parseInt(threshold, 10);
    if (Number.isNaN(value)) return;
    try {
      const data = await updateDetectionRule(rule.ruleId, { threshold: value });
      setRules((prev) => prev.map((r) => (r.ruleId === rule.ruleId ? data.rule : r)));
      toast.success('Threshold updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update threshold');
    }
  }

  return (
    <div>
      <PageHeader
        title="Detection Rules"
        subtitle="Manage SIEM detection logic — enable, tune thresholds, and review MITRE mappings"
        icon={ShieldAlert}
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!canManageRules && (
        <p className="text-xs text-gray-500 mb-4">
          Read-only — detection rule management requires an admin account.
        </p>
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : rules.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No rules configured" description="Detection rules sync automatically from the engine." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule) => (
            <GlassCard key={rule.ruleId}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{rule.name}</h3>
                    <code className="text-[10px] text-gray-500 font-mono">{rule.ruleId}</code>
                    <SeverityBadge severity={rule.severity} />
                    {rule.mitreTactic && (
                      <MitreTechniqueBadge tactic={rule.mitreTactic} techniqueId={rule.mitreTechniqueId} compact />
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${rule.enabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{rule.description}</p>
                  <p className="text-xs text-gray-600">
                    Events: {(rule.eventTypes || []).join(', ')} · Window: {rule.windowMinutes}m
                  </p>
                </div>

                {canManageRules && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-xs text-gray-500 flex items-center gap-2">
                      Threshold
                      <input
                        type="number"
                        min={1}
                        defaultValue={rule.threshold}
                        onBlur={(e) => handleThresholdChange(rule, e.target.value)}
                        className="w-16 px-2 py-1 rounded bg-soc-bg border border-soc-border text-white text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleToggle(rule)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${rule.enabled ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'}`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
