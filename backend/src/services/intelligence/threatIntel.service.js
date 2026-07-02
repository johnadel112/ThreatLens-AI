/** Simulated threat intelligence enrichment — deterministic, no external APIs. */

const MALICIOUS_PREFIXES = ['198.51.', '203.0.113.', '185.220.', '45.142.', '91.134.'];
const SUSPICIOUS_PREFIXES = ['104.28.', '172.16.', '10.0.', '192.168.'];

const COUNTRIES = [
  { country: 'United States', city: 'New York', asn: 'AS15169 Google LLC' },
  { country: 'Russia', city: 'Moscow', asn: 'AS12389 Rostelecom' },
  { country: 'China', city: 'Shanghai', asn: 'AS4134 China Telecom' },
  { country: 'Germany', city: 'Frankfurt', asn: 'AS24940 Hetzner Online' },
  { country: 'Brazil', city: 'São Paulo', asn: 'AS26599 Terremark' },
  { country: 'Netherlands', city: 'Amsterdam', asn: 'AS14061 DigitalOcean' },
  { country: 'Unknown', city: 'Unknown', asn: 'AS00000 Simulated Hosting Provider' },
];

const BEHAVIOR_TAGS = {
  malicious: ['brute_force', 'port_scan', 'credential_stuffing', 'botnet_activity'],
  suspicious: ['proxy_exit', 'tor_relay', 'scanning', 'anomalous_geo'],
  benign: ['corporate_vpn', 'cdn_edge', 'known_isp'],
};

function hashIp(ip = '') {
  let h = 0;
  for (let i = 0; i < ip.length; i += 1) {
    h = (h * 31 + ip.charCodeAt(i)) % 100000;
  }
  return h;
}

function reputationForIp(ip) {
  if (!ip) return 'unknown';
  if (MALICIOUS_PREFIXES.some((p) => ip.startsWith(p))) return 'malicious';
  if (SUSPICIOUS_PREFIXES.some((p) => ip.startsWith(p))) return 'suspicious';
  const h = hashIp(ip);
  if (h % 17 === 0) return 'malicious';
  if (h % 7 === 0) return 'suspicious';
  return 'benign';
}

export function enrichIp(ip, context = {}) {
  if (!ip) return null;

  const reputation = reputationForIp(ip);
  const geo = COUNTRIES[hashIp(ip) % COUNTRIES.length];
  const confidence = reputation === 'malicious' ? 75 + (hashIp(ip) % 20) : reputation === 'suspicious' ? 55 + (hashIp(ip) % 25) : 20 + (hashIp(ip) % 30);
  const now = new Date();
  const daysAgo = (hashIp(ip) % 90) + 1;

  return {
    ip,
    reputation,
    country: context.country || geo.country,
    city: context.city || geo.city,
    asn: geo.asn,
    provider: geo.asn.replace(/^AS\d+\s+/, ''),
    knownFor: BEHAVIOR_TAGS[reputation] || BEHAVIOR_TAGS.benign,
    confidence,
    firstSeen: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: now.toISOString(),
    tags: [...(BEHAVIOR_TAGS[reputation] || []), reputation],
    simulated: true,
  };
}

export function enrichEntity({ ip, username, deviceId } = {}) {
  const intel = ip ? enrichIp(ip) : null;
  return {
    ip: intel,
    username: username ? { entity: username, type: 'user', simulated: true } : null,
    device: deviceId ? { entity: deviceId, type: 'device', simulated: true } : null,
  };
}

export function reputationRiskBoost(reputation) {
  if (reputation === 'malicious') return 18;
  if (reputation === 'suspicious') return 10;
  if (reputation === 'benign') return 0;
  return 4;
}
