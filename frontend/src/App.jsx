import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import GuestRoute from './components/layout/GuestRoute';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import IncidentDetail from './pages/IncidentDetail';
import AgentActivity from './pages/AgentActivity';
import Login from './pages/Login';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Register from './pages/Register';
import AuditLogs from './pages/AuditLogs';
import DetectionRules from './pages/DetectionRules';
import Notifications from './pages/Notifications';
import PlaybookQueue from './pages/PlaybookQueue';
import PermissionRoute from './components/layout/PermissionRoute';
import { PERMISSIONS } from './utils/permissions';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="incidents/:id/agents" element={<AgentActivity />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route
          path="audit"
          element={
            <PermissionRoute permission={PERMISSIONS.AUDIT_LOGS_READ}>
              <AuditLogs />
            </PermissionRoute>
          }
        />
        <Route path="rules" element={<DetectionRules />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="playbooks" element={<PlaybookQueue />} />
      </Route>
    </Routes>
  );
}
