const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'iloveyou',
  'threatlens',
  'threatlensai',
  'monkey',
  'dragon',
  'master',
  'login',
  'abc123',
  'passw0rd',
]);

const LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];

const COLOR_KEYS = ['neutral', 'critical', 'warning', 'amber', 'accent', 'success'];

const SEQUENCES = [
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
  '0123456789',
  '9876543210',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

function hasRepeatedChars(password) {
  return /(.)\1{2,}/.test(password);
}

function hasSimpleSequence(password) {
  const lower = password.toLowerCase();
  if (lower.length < 3) return false;
  for (let i = 0; i <= lower.length - 3; i += 1) {
    const slice = lower.slice(i, i + 3);
    for (const seq of SEQUENCES) {
      if (seq.includes(slice)) return true;
    }
  }
  return false;
}

function containsUserInfo(password, email = '', name = '') {
  const pwd = password.toLowerCase();
  const emailLocal = email.split('@')[0]?.toLowerCase() || '';
  const nameParts = name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);

  if (emailLocal.length >= 3 && pwd.includes(emailLocal)) return true;
  return nameParts.some((part) => pwd.includes(part));
}

function varietyScore(password) {
  const sets = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return sets.filter(Boolean).length;
}

function buildFeedback(score, checks) {
  if (!checks.minLength) return 'Add more characters to improve your password.';
  if (!checks.notCommon) return 'Avoid common passwords — try something more unique.';
  if (!checks.number || !checks.lowercase) return 'Good start — add a number or symbol.';
  if (!checks.uppercase) return 'Add an uppercase letter to strengthen your password.';
  if (!checks.special) return 'Add a special character for a stronger password.';
  if (!checks.noRepeatedPatterns) return 'Avoid repeated or sequential patterns.';
  if (score >= 5) return 'Excellent — this password meets all requirements.';
  if (score >= 4) return 'Strong password. Nice.';
  if (score >= 3) return 'Fair password — a few more characters or symbols will help.';
  return 'Keep going — mix letters, numbers, and symbols.';
}

/**
 * @param {string} password
 * @param {{ email?: string, name?: string }} context
 */
export function evaluatePasswordStrength(password, context = {}) {
  const { email = '', name = '' } = context;

  const emptyChecks = {
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    notCommon: true,
    noRepeatedPatterns: true,
  };

  if (!password) {
    return {
      score: 0,
      label: '',
      percentage: 0,
      color: 'neutral',
      checks: emptyChecks,
      feedback: '',
    };
  }

  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    noRepeatedPatterns: !hasRepeatedChars(password) && !hasSimpleSequence(password),
  };

  const lower = password.toLowerCase();
  const isCommon = COMMON_PASSWORDS.has(lower);
  const hasUserInfo = containsUserInfo(password, email, name);
  const variety = varietyScore(password);

  let score = 1;

  if (password.length < 4) {
    score = 1;
  } else if (isCommon) {
    score = 2;
  } else if (password.length < 8 || (!checks.lowercase && !checks.number)) {
    score = 2;
  } else if (
    checks.minLength &&
    checks.lowercase &&
    checks.number &&
    (checks.uppercase || checks.special)
  ) {
    if (
      password.length >= 12 &&
      checks.uppercase &&
      checks.lowercase &&
      checks.number &&
      checks.special &&
      checks.notCommon &&
      checks.noRepeatedPatterns &&
      !hasUserInfo &&
      variety >= 4
    ) {
      score = 5;
    } else if (
      checks.uppercase &&
      checks.lowercase &&
      checks.number &&
      (checks.special || password.length >= 10)
    ) {
      score = 4;
    } else {
      score = 3;
    }
  } else {
    score = 2;
  }

  if (!checks.notCommon && score > 2) score = 2;

  const percentage = Math.round((score / 5) * 100);

  return {
    score,
    label: LABELS[score],
    percentage,
    color: COLOR_KEYS[score],
    checks,
    feedback: buildFeedback(score, checks),
  };
}

export const STRENGTH_BAR_COLORS = {
  neutral: 'bg-gray-600',
  critical: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]',
  warning: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.35)]',
  amber: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]',
  accent: 'bg-soc-accent shadow-[0_0_12px_rgba(34,211,238,0.4)]',
  success: 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.45)]',
};

export const STRENGTH_TEXT_COLORS = {
  neutral: 'text-gray-500',
  critical: 'text-red-400',
  warning: 'text-orange-400',
  amber: 'text-amber-300',
  accent: 'text-soc-accent',
  success: 'text-emerald-400',
};
