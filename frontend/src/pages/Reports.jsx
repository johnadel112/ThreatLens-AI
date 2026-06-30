import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { getReports } from '../api/reports';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/LoadingSkeleton';
import SeverityBadge from '../components/ui/SeverityBadge';

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getReports({ page, limit: 20 });
        setReports(data.reports || []);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page]);

  return (
    <div>
      <PageHeader
        title="SOC Reports"
        subtitle="AI-assisted investigation reports from completed incident workflows"
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-soc-critical/10 border border-soc-critical/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Complete an AI investigation on an incident, then generate a professional SOC report."
          action={
            <Link to="/incidents" className="btn-primary text-sm">
              Go to Incidents
            </Link>
          }
        />
      ) : (
        <>
          <div className="glass-panel overflow-hidden p-0">
            <table className="data-table">
              <thead>
                <tr className="text-left text-gray-500 border-b border-soc-border">
                  <th className="px-5 py-3 font-medium">Incident</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Classification</th>
                  <th className="px-5 py-3 font-medium">Generated</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-soc-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{report.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.username || '—'} · {report.ip || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={report.severity} />
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {report.threatClassification?.attackType || '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {formatTime(report.report?.generatedAt)}
                    </td>
                    <td className="px-5 py-4 text-gray-500">v{report.report?.version || 1}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/reports/${report.id}`}
                        className="text-soc-accent hover:underline text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Page {pagination.page} of {pagination.pages} ({pagination.total} reports)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-soc-border disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-soc-border disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
