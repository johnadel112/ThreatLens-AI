/** Canonical event types stored in MongoDB */
export const EVENT_TYPES = [
  // Authentication
  'login_success',
  'login_failed',
  'logout',
  'password_change',
  'password_reset_requested',
  'password_reset_completed',
  'mfa_success',
  'mfa_failed',
  'account_locked',
  'account_unlocked',
  'impossible_travel_login',
  'login_from_new_device',
  'login_from_new_country',
  // Admin & privilege
  'admin_login',
  'admin_action',
  'permission_change',
  'role_change',
  'privilege_escalation',
  'user_created',
  'user_deleted',
  'user_disabled',
  'api_key_created',
  'api_key_deleted',
  'service_account_used',
  // File & data
  'file_download',
  'file_upload',
  'bulk_file_download',
  'sensitive_file_access',
  'restricted_file_access_denied',
  'database_export',
  'unusual_data_access',
  'large_data_transfer',
  'data_exfiltration_attempt',
  // API & web
  'api_request',
  'api_rate_limit_exceeded',
  'suspicious_api_volume',
  'endpoint_probe',
  'unauthorized_api_access',
  'forbidden_request',
  'suspicious_user_agent',
  'sql_injection_attempt',
  'xss_attempt',
  'directory_traversal_attempt',
  // Network & recon
  'network_access',
  'port_scan',
  'endpoint_scan',
  'network_probe',
  'suspicious_ip_activity',
  'repeated_404',
  'firewall_block',
  'suspicious_dns_query',
  // Endpoint & malware
  'malware_alert',
  'suspicious_process',
  'antivirus_quarantine',
  'unauthorized_usb_inserted',
  'suspicious_script_execution',
  'ransomware_behavior',
  'command_and_control_beacon',
  // System & audit
  'config_change',
  'security_policy_change',
  'audit_log_cleared',
  'service_started',
  'service_stopped',
  'backup_started',
  'backup_completed',
  'backup_failed',
  'system_error',
];

/** Incoming aliases normalized before persistence */
export const EVENT_TYPE_ALIASES = {
  failed_login: 'login_failed',
  successful_login: 'login_success',
};

export const ACCEPTED_EVENT_TYPES = [
  ...EVENT_TYPES,
  ...Object.keys(EVENT_TYPE_ALIASES),
];

export function normalizeEventType(eventType) {
  return EVENT_TYPE_ALIASES[eventType] || eventType;
}

/** Event types that count toward specific detection logic */
export const DETECTION_EVENT_GROUPS = {
  failedAuth: ['login_failed', 'mfa_failed'],
  successfulAuth: ['login_success'],
  downloads: ['file_download', 'bulk_file_download', 'large_data_transfer', 'database_export'],
  recon: ['network_access', 'port_scan', 'endpoint_probe', 'repeated_404', 'endpoint_scan', 'network_probe'],
  privilegeChange: ['permission_change', 'role_change', 'privilege_escalation'],
  malware: ['malware_alert', 'suspicious_process', 'command_and_control_beacon', 'ransomware_behavior'],
  apiTraffic: ['api_request', 'api_rate_limit_exceeded', 'suspicious_api_volume'],
};
