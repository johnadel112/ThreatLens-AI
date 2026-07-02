import { motion } from 'framer-motion';
import { Activity, Brain, Shield } from 'lucide-react';
import CyberShieldIllustration from '../visuals/CyberShieldIllustration';

const features = [
  { icon: Shield, label: 'Real-time threat monitoring' },
  { icon: Brain, label: 'AI-powered investigation' },
  { icon: Activity, label: 'SOAR playbook automation' },
];

export default function AuthHeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="hidden lg:flex flex-col justify-center pr-8"
    >
      <div className="relative">
        <div className="absolute -inset-8 bg-gradient-to-br from-soc-accent/10 via-transparent to-purple-500/10 rounded-3xl blur-2xl" />
        <CyberShieldIllustration className="relative mx-auto drop-shadow-[0_0_40px_rgba(34,211,238,0.15)]" />
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold text-white leading-tight">
          Secure your operations with AI intelligence
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
          ThreatLens AI correlates live events, detects threats, and guides analysts through
          investigation — from alert to SOC report.
        </p>
        <ul className="space-y-3 pt-2">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-gray-300">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-soc-accent/10 border border-soc-accent/20">
                <Icon className="w-4 h-4 text-soc-accent" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
