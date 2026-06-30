import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { severityChartData, statusChartData, typeChartData } from '../../utils/chartHelpers';

const tooltipStyle = {
  backgroundColor: '#1a2332',
  border: '1px solid #2d3748',
  borderRadius: '8px',
  color: '#e5e7eb',
};

function ChartShell({ title, children, className = '' }) {
  return (
    <div className={`bg-soc-surface border border-soc-border rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function KpiGrid({ stats }) {
  const cards = [
    { label: 'Security Events', value: stats?.events?.total ?? 0, sub: 'Last 7 days trend below' },
    { label: 'Open Alerts', value: stats?.alerts?.openCount ?? 0, sub: `${stats?.alerts?.total ?? 0} total alerts` },
    { label: 'Active Incidents', value: stats?.incidents?.openCount ?? 0, sub: `${stats?.incidents?.total ?? 0} total incidents` },
    { label: 'Playbook Actions', value: stats?.playbooks?.pendingCount ?? 0, sub: `${stats?.playbooks?.executedCount ?? 0} executed` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-soc-surface border border-soc-border rounded-xl p-5">
          <p className="text-sm text-gray-400">{card.label}</p>
          <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function EventTimelineChart({ timeline = [] }) {
  const data = timeline.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  return (
    <ChartShell title="Event Volume (7 days)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function SeverityCharts({ alerts, incidents }) {
  const alertData = severityChartData(alerts?.bySeverity);
  const incidentData = severityChartData(incidents?.bySeverity);

  return (
    <>
      <ChartShell title="Alerts by Severity">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={alertData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {alertData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Incidents by Severity">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={incidentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {incidentData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </>
  );
}

export function StatusPieCharts({ alerts, incidents }) {
  const alertData = statusChartData(alerts?.byStatus, 'status');
  const incidentData = statusChartData(incidents?.byStatus, 'status');

  return (
    <>
      <ChartShell title="Alert Status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={alertData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {alertData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell title="Incident Status">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={incidentData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {incidentData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
    </>
  );
}

export function EventTypeChart({ events }) {
  const data = typeChartData(events?.byType);

  return (
    <ChartShell title="Top Event Types" className="xl:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={11} width={120} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
