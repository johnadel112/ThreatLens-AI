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
import { severityChartData, statusChartData, typeChartData, hourlyVolumeFromEvents } from '../../utils/chartHelpers';

const tooltipStyle = {
  backgroundColor: 'rgba(12, 20, 38, 0.95)',
  border: '1px solid rgba(34, 211, 238, 0.2)',
  borderRadius: '12px',
  color: '#e5e7eb',
  backdropFilter: 'blur(8px)',
};

function ChartShell({ title, children, className = '' }) {
  return (
    <div className={`glass-panel ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
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

function ChartEmpty({ message = 'Collecting live telemetry…' }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="flex gap-1 mb-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-soc-accent/60 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function EventVolumeHourlyChart({ events = [] }) {
  const data = hourlyVolumeFromEvents(events);
  const hasData = data.some((d) => d.count > 0);

  return (
    <ChartShell title="Event Volume (Last 24 Hours)">
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" stroke="#6b7280" fontSize={10} interval="preserveStartEnd" />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function EventTimelineChart({ timeline = [] }) {
  const data = timeline.map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }));
  const hasData = data.some((d) => d.count > 0);

  return (
    <ChartShell title="Event Volume (7 Days)">
      {!hasData ? (
        <ChartEmpty message="No events in the last 7 days yet" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export function SeverityCharts({ alerts, incidents }) {
  const alertData = severityChartData(alerts?.bySeverity);
  const incidentData = severityChartData(incidents?.bySeverity);
  const alertsEmpty = !alertData.some((d) => d.count > 0);
  const incidentsEmpty = !incidentData.some((d) => d.count > 0);

  return (
    <>
      <ChartShell title="Alerts by Severity">
        {alertsEmpty ? (
          <ChartEmpty message="No alerts recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
        )}
      </ChartShell>

      <ChartShell title="Incidents by Severity">
        {incidentsEmpty ? (
          <ChartEmpty message="No incidents recorded yet" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
        )}
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
