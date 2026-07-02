import GlassCard from '../ui/GlassCard';
import SeverityBadge from '../ui/SeverityBadge';
import RiskScoreBadge from '../ui/RiskScoreBadge';
import MitreTechniqueBadge from '../ui/MitreTechniqueBadge';
import ThreatIntelCard from '../ui/ThreatIntelCard';
import { parseSocReportMarkdown } from '../../utils/parseSocReport';

function Section({ title, children, className = '' }) {
  if (!children) return null;
  return (
    <GlassCard className={className}>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 pb-2 border-b border-white/[0.06]">
        {title}
      </h3>
      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{children}</div>
    </GlassCard>
  );
}

function KeyValueTable({ rows, headers = ['Field', 'Value'] }) {
  if (!rows?.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="data-table text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="text-gray-400 font-medium">{row[0]}</td>
              <td className="text-white">{row[1]}</td>
              {row[2] && <td className="text-gray-400">{row[2]}</td>}
              {row[3] && <td className="text-gray-400">{row[3]}</td>}
              {row[4] && <td><SeverityBadge severity={row[4]} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ text }) {
  if (!text) return null;
  const items = text.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('**'));
  if (!items.length) return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-soc-accent/30">
          {item.replace(/^-\s*/, '').replace(/\*\*/g, '')}
        </li>
      ))}
    </ul>
  );
}

export default function SOCReportViewer({ report }) {
  const { sections, metadata } = parseSocReportMarkdown(report.markdown);

  return (
    <div className="space-y-6" id="report-viewer">
      <GlassCard glow className="bg-gradient-to-br from-soc-accent/5 to-transparent">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-soc-accent uppercase tracking-widest mb-2">
              ThreatLens AI · AI-Assisted SOC Investigation Report
            </p>
            <h2 className="text-2xl font-bold text-white leading-tight">{report.title}</h2>
            <p className="text-sm text-gray-500 mt-2">
              Report {metadata.reportId || '—'} · Incident {report.incidentId}
            </p>
          </div>
          <SeverityBadge severity={report.severity} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status', value: report.status || '—' },
          { label: 'Version', value: `v${report.version || metadata.version || 1}` },
          { label: 'Generated', value: report.generatedAt ? new Date(report.generatedAt).toLocaleString() : metadata.generatedAt || '—' },
          { label: 'Risk Score', value: report.riskScore != null ? `${report.riskScore}/100` : '—' },
          { label: 'Correlation', value: report.correlationScore != null ? `${report.correlationScore}/100` : '—' },
          { label: 'Classification', value: report.threatClassification?.attackType || '—' },
        ].map((item) => (
          <div key={item.label} className="glass-panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
            <p className="text-sm text-white font-medium mt-1 break-words">{item.value}</p>
          </div>
        ))}
      </div>

      {sections['Executive Summary'] && (
        <Section title="Executive Summary">{sections['Executive Summary']}</Section>
      )}

      {sections.overviewTable?.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Incident Overview</h3>
          <KeyValueTable rows={sections.overviewTable} />
        </GlassCard>
      )}

      {sections['Threat Classification'] && (
        <Section title="Threat Classification">
          <div className="space-y-3">
            {(report.threatClassification?.mitreTactic || report.mitre?.primaryTactic) && (
              <MitreTechniqueBadge
                tactic={report.threatClassification?.mitreTactic || report.mitre?.primaryTactic}
                technique={report.threatClassification?.mitreTechnique || report.mitre?.techniques?.[0]?.technique}
                techniqueId={report.threatClassification?.techniqueId || report.mitre?.techniques?.[0]?.techniqueId}
              />
            )}
            <BulletList text={sections['Threat Classification']} />
          </div>
        </Section>
      )}

      {sections['Correlation Analysis'] && (
        <Section title="Correlation Analysis">
          <BulletList text={sections['Correlation Analysis']} />
        </Section>
      )}

      {sections['Threat Intelligence'] && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Threat Intelligence</h3>
          <BulletList text={sections['Threat Intelligence']} />
        </GlassCard>
      )}

      {report.threatIntel?.ip && <ThreatIntelCard intel={report.threatIntel} />}

      {sections['AI Triage Summary'] && <Section title="AI Triage Summary">{sections['AI Triage Summary']}</Section>}
      {sections['Investigation Summary'] && <Section title="Investigation Summary">{sections['Investigation Summary']}</Section>}
      {sections['Root Cause Analysis'] && <Section title="Root Cause Analysis">{sections['Root Cause Analysis']}</Section>}
      {sections['Impact Assessment'] && <Section title="Impact Assessment">{sections['Impact Assessment']}</Section>}

      {sections.Timeline && (
        <Section title="Event Timeline">
          <BulletList text={sections.Timeline} />
        </Section>
      )}

      {sections['Alerts Triggered'] && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Alerts Triggered</h3>
          <BulletList text={sections['Alerts Triggered']} />
        </GlassCard>
      )}

      {sections.evidenceTable?.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Evidence</h3>
          <KeyValueTable
            rows={sections.evidenceTable}
            headers={['Timestamp', 'Event Type', 'User', 'IP', 'Severity']}
          />
        </GlassCard>
      )}

      {sections['Mitigation Recommendations'] && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Mitigation Recommendations</h3>
          <BulletList text={sections['Mitigation Recommendations']} />
        </GlassCard>
      )}

      {sections['Playbook Actions'] && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Playbook Actions</h3>
          <BulletList text={sections['Playbook Actions']} />
        </GlassCard>
      )}

      {sections['Reviewer Notes'] && <Section title="Reviewer Notes">{sections['Reviewer Notes']}</Section>}

      {sections['Final Conclusion'] && (
        <GlassCard className="border-emerald-500/20 bg-emerald-500/5">
          <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide mb-4">Final Conclusion</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{sections['Final Conclusion']}</p>
        </GlassCard>
      )}
    </div>
  );
}
