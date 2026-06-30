/** Fake identity and infrastructure dataset — RFC 5737 / documentation ranges only */

export const USERS = [
  { username: 'john.smith', role: 'analyst', department: 'security', title: 'SOC Analyst' },
  { username: 'alice.chen', role: 'engineer', department: 'engineering', title: 'Backend Engineer' },
  { username: 'bob.martinez', role: 'sales', department: 'sales', title: 'Account Executive' },
  { username: 'carol.nguyen', role: 'hr', department: 'human_resources', title: 'HR Manager' },
  { username: 'david.kim', role: 'finance', department: 'finance', title: 'Financial Analyst' },
  { username: 'emma.wilson', role: 'engineer', department: 'engineering', title: 'DevOps Engineer' },
  { username: 'frank.lee', role: 'viewer', department: 'operations', title: 'Operations Coordinator' },
  { username: 'grace.patel', role: 'analyst', department: 'security', title: 'Threat Hunter' },
  { username: 'admin', role: 'admin', department: 'it', title: 'System Administrator' },
  { username: 'svc-backup', role: 'service', department: 'it', title: 'Backup Service Account' },
  { username: 'jdoe', role: 'finance', department: 'finance', title: 'Finance Specialist' },
  { username: 'mike.johnson', role: 'engineer', department: 'engineering', title: 'Full Stack Developer' },
];

export const ATTACK_PERSONAS = {
  bruteForce: { username: 'jdoe', ip: '203.0.113.45', country: 'Unknown', city: 'Unknown' },
  exfil: { username: 'jdoe', ip: '203.0.113.45', country: 'RU', city: 'Moscow' },
  admin: { username: 'admin', ip: '198.51.100.77', country: 'CN', city: 'Shanghai' },
  scanner: { username: 'system', ip: '192.0.2.99', country: 'Unknown', city: 'Unknown' },
  malware: { username: 'emma.wilson', ip: '10.0.2.19', country: 'US', city: 'Chicago' },
  apiAbuse: { username: 'system', ip: '198.51.100.55', country: 'Unknown', city: 'Unknown' },
};

export const IPS = {
  internal: ['10.0.1.12', '10.0.1.34', '10.0.2.8', '10.0.2.19', '10.0.3.44'],
  external: ['198.51.100.22', '198.51.100.55', '192.0.2.17', '203.0.113.45', '198.51.100.77'],
  attacker: '203.0.113.45',
  scanner: '192.0.2.99',
};

export const COUNTRIES = ['US', 'UK', 'DE', 'CA', 'AU', 'FR', 'JP', 'Unknown', 'RU', 'CN', 'BR'];
export const CITIES = ['New York', 'London', 'Berlin', 'Toronto', 'Sydney', 'Paris', 'Tokyo', 'Unknown', 'Moscow', 'Shanghai'];

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) Safari/17.3',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/122.0.0.0',
  'curl/8.4.0',
  'python-requests/2.31.0',
  'Unknown',
];

export const ENDPOINTS = [
  '/login', '/dashboard', '/api/v1/users', '/api/v1/reports', '/api/v1/events',
  '/api/v1/alerts', '/api/v1/health', '/admin/config', '/files/download',
  '/files/upload', '/api/v1/incidents', '/.env', '/wp-admin', '/api/v1/keys',
];

export const FILE_NAMES = [
  'report-Q1.pdf', 'report-Q2.pdf', 'budget-2026.xlsx', 'employee-handbook.pdf',
  'client-contract.docx', 'invoice-march.pdf', 'project-plan.pptx', 'security-policy.pdf',
  'payroll-export.csv', 'customer-pii.xlsx', 'source-code-backup.zip',
];

export const SOURCES = [
  'web-app', 'auth-service', 'file-gateway', 'iam-service', 'admin-console',
  'network-monitor', 'api-gateway', 'endpoint-agent', 'siem-collector', 'backup-service',
];

export const DEVICES = ['DEV-WIN-1042', 'DEV-MAC-2201', 'DEV-LIN-3308', 'DEV-MOB-4410', 'Unknown'];

export const PROCESSES = ['powershell.exe', 'cmd.exe', 'wscript.exe', 'svchost.exe', 'explorer.exe', 'unknown.bin'];

export const SEVERITY_DEFAULTS = {
  info: ['backup_completed', 'backup_started', 'service_started', 'logout', 'mfa_success'],
  low: ['login_success', 'api_request', 'file_download', 'file_upload'],
  medium: ['login_failed', 'mfa_failed', 'permission_change', 'config_change'],
  high: ['bulk_file_download', 'port_scan', 'malware_alert', 'api_rate_limit_exceeded'],
  critical: ['ransomware_behavior', 'data_exfiltration_attempt', 'privilege_escalation', 'audit_log_cleared'],
};

export const SCENARIO_EXPECTATIONS = {
  normal: { alerts: [], incidents: [] },
  bruteForce: { alerts: ['Brute Force Login Attempt'], incidents: [] },
  accountCompromise: { alerts: ['Brute Force Login Attempt', 'Possible Account Compromise'], incidents: ['Possible Account Compromise'] },
  dataExfiltration: { alerts: ['Possible Data Exfiltration'], incidents: ['Possible Data Exfiltration'] },
  fullAttackChain: {
    alerts: ['Brute Force Login Attempt', 'Possible Account Compromise', 'Possible Data Exfiltration', 'Possible Privilege Escalation'],
    incidents: ['Possible Account Compromise', 'Account Compromise with Data Exfiltration'],
  },
  suspiciousAdmin: { alerts: ['Suspicious Admin Activity'], incidents: ['Suspicious Admin Activity'] },
  portScan: { alerts: ['Port Scan / Reconnaissance'], incidents: ['Reconnaissance Activity'] },
  privilegeEscalation: { alerts: ['Possible Privilege Escalation'], incidents: [] },
  malware: { alerts: ['Endpoint Malware Activity'], incidents: ['Endpoint Malware Incident'] },
  ransomware: { alerts: ['Endpoint Malware Activity'], incidents: ['Ransomware-style Incident'] },
  apiAbuse: { alerts: ['API Abuse / Suspicious Volume'], incidents: [] },
  falsePositive: { alerts: [], incidents: [] },
  edge: { alerts: [], incidents: [] },
  stress: { alerts: ['multiple'], incidents: ['multiple'] },
  fullDemo: {
    alerts: [
      'Brute Force Login Attempt', 'Possible Account Compromise', 'Possible Data Exfiltration',
      'Suspicious Admin Activity', 'Port Scan / Reconnaissance', 'Endpoint Malware Activity',
      'API Abuse / Suspicious Volume',
    ],
    incidents: [
      'Possible Account Compromise', 'Account Compromise with Data Exfiltration',
      'Suspicious Admin Activity', 'Reconnaissance Activity', 'Endpoint Malware Incident',
    ],
  },
};
