/** Shared helpers for event simulation */

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isoNow(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

export function offsetTimestamp(baseDate, offsetSeconds) {
  return new Date(baseDate.getTime() + offsetSeconds * 1000).toISOString();
}

/** RFC 5737 documentation IPs — safe for demos */
export const DEMO_IPS = {
  attacker: '203.0.113.45',
  internal: ['10.0.1.12', '10.0.1.34', '10.0.2.8', '10.0.2.19'],
  external: ['198.51.100.22', '198.51.100.55', '192.0.2.17'],
};

export const NORMAL_USERS = [
  { username: 'alice', department: 'engineering' },
  { username: 'bob', department: 'sales' },
  { username: 'carol', department: 'hr' },
  { username: 'dsmith', department: 'finance' },
];

export const ATTACK_TARGET = {
  username: 'jdoe',
  department: 'finance',
};

export const FILE_NAMES = [
  'report-Q1.pdf',
  'report-Q2.pdf',
  'budget-2026.xlsx',
  'employee-handbook.pdf',
  'client-contract.docx',
  'invoice-march.pdf',
  'project-plan.pptx',
  'security-policy.pdf',
];

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];
