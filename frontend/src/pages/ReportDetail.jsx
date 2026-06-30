import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getReport } from '../api/reports';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import SOCReportViewer from '../components/reports/SOCReportViewer';
import { FileText } from 'lucide-react';
import { downloadMarkdownReport, printReport } from '../utils/reportExport';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getReport(id);
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load report');
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <TableSkeleton rows={6} />;

  if (error || !report) {
    return (
      <EmptyState
        icon={FileText}
        title="Report not found"
        description={error || 'This report may have been deleted or you do not have access.'}
        action={
          <Link to="/reports" className="btn-ghost text-sm">
            ← Back to Reports
          </Link>
        }
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/reports" className="text-sm text-soc-accent hover:underline mb-4 inline-block print:hidden">
        ← Back to Reports
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 print:hidden">
        <div className="min-w-0">
          <p className="text-xs font-mono text-soc-accent uppercase tracking-widest mb-2">ThreatLens AI</p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white leading-tight">{report.title}</h1>
            <SeverityBadge severity={report.severity} />
            {report.status && <StatusBadge status={report.status} />}
          </div>
          <p className="text-sm text-gray-400">
            Generated {new Date(report.generatedAt).toLocaleString()} · Version {report.version}
          </p>
          {report.threatClassification?.attackType && (
            <p className="text-sm text-gray-500 mt-1">
              {report.threatClassification.attackType}
              {report.threatClassification.category ? ` — ${report.threatClassification.category}` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => downloadMarkdownReport(report)} className="btn-ghost text-sm py-2">
            Download Markdown
          </button>
          <button type="button" onClick={printReport} className="btn-primary text-sm py-2">
            Print / Save PDF
          </button>
          <Link to={`/incidents/${report.incidentId}`} className="btn-ghost text-sm py-2">
            View Incident
          </Link>
        </div>
      </div>

      <div id="report-content" className="print:block">
        <SOCReportViewer report={report} />
      </div>
    </div>
  );
}
