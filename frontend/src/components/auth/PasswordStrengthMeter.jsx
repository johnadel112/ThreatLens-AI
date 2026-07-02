import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import {
  evaluatePasswordStrength,
  STRENGTH_BAR_COLORS,
  STRENGTH_TEXT_COLORS,
} from '../../utils/passwordStrength';

const REQUIREMENTS = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'uppercase', label: 'Contains uppercase letter' },
  { key: 'lowercase', label: 'Contains lowercase letter' },
  { key: 'number', label: 'Contains number' },
  { key: 'special', label: 'Contains special character' },
  { key: 'notCommon', label: 'Not a common password' },
  { key: 'noRepeatedPatterns', label: 'No repeated simple patterns' },
];

export default function PasswordStrengthMeter({ password, email = '', name = '', className = '' }) {
  const reduceMotion = useReducedMotion();
  const result = useMemo(
    () => evaluatePasswordStrength(password, { email, name }),
    [password, email, name]
  );

  if (!password) return null;

  const barColor = STRENGTH_BAR_COLORS[result.color] || STRENGTH_BAR_COLORS.neutral;
  const textColor = STRENGTH_TEXT_COLORS[result.color] || STRENGTH_TEXT_COLORS.neutral;

  return (
    <div
      className={`mt-3 space-y-3 ${className}`}
      role="region"
      aria-label="Password strength"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Password strength:{' '}
          <span className={`font-semibold ${textColor}`}>{result.label}</span>
        </p>
        <span className="text-[10px] text-gray-600 tabular-nums">{result.percentage}%</span>
      </div>

      <div
        className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
        role="progressbar"
        aria-valuenow={result.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Password strength: ${result.label}`}
      >
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={false}
          animate={{ width: `${result.percentage}%` }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {result.feedback && (
        <p className="text-xs text-gray-400 leading-relaxed">{result.feedback}</p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Password requirements">
        {REQUIREMENTS.map(({ key, label }) => {
          const met = result.checks[key];
          return (
            <li key={key} className="flex items-center gap-2 text-xs min-h-[20px]">
              {met ? (
                <Check className="w-3.5 h-3.5 text-soc-accent shrink-0" aria-hidden />
              ) : (
                <Circle className="w-3.5 h-3.5 text-gray-600 shrink-0" aria-hidden />
              )}
              <span className={met ? 'text-gray-300' : 'text-gray-500'}>{label}</span>
              <span className="sr-only">{met ? 'met' : 'not met'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
