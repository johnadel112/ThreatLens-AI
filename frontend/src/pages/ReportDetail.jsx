import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getReport } from '../api/reports';
import SeverityBadge from '../components/ui/SeverityBadge';
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
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading report...</p>;

  if (error || !report) {
    return (
      <div>
        <p className="text-red-300">{error || 'Report not found'}</p>
        <Link to="/reports" className="text-soc-accent text-sm mt-2 inline-block hover:underline">
          ← Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/reports" className="text-sm text-soc-accent hover:underline mb-4 inline-block print:hidden">
        ← Back to reports
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">{report.title}</h2>
            <SeverityBadge severity={report.severity} />
          </div>
          <p className="text-sm text-gray-400">
            Generated {new Date(report.generatedAt).toLocaleString()} · Version {report.version}
          </p>
          {report.threatClassification?.attackType && (
            <p className="text-sm text-gray-500 mt-1">
              {report.threatClassification.attackType} — {report.threatClassification.category}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadMarkdownReport(report)}
            className="px-4 py-2 rounded-lg text-sm border border-soc-border text-gray-300 hover:text-white"
          >
            Download Markdown
          </button>
          <button
            type="button"
            onClick={printReport}
            className="px-4 py-2 rounded-lg text-sm bg-soc-accent/10 border border-soc-accent/30 text-soc-accent hover:bg-soc-accent/20"
          >
            Print / Save PDF
          </button>
          <Link
            to={`/incidents/${report.incidentId}`}
            className="px-4 py-2 rounded-lg text-sm border border-soc-border text-gray-300 hover:text-white"
          >
            View Incident
          </Link>
        </div>
      </div>

      <article
        id="report-content"
        className="bg-soc-surface border border-soc-border rounded-xl p-8 markdown-report"
      >
        <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
          <h1>{report.title}</h1>
          <p className="text-sm text-gray-600">
            ThreatLens AI SOC Report · {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <ReactMarkdown>{report.markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
