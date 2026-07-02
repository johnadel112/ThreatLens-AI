import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthScene from './AuthScene';
import AuthHeroPanel from './AuthHeroPanel';
import CyberShieldIllustration from '../visuals/CyberShieldIllustration';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <AuthScene />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <AuthHeroPanel />

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 lg:mb-8"
            >
              <div className="lg:hidden flex justify-center mb-4">
                <CyberShieldIllustration compact className="opacity-90" />
              </div>
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-soc-accent/30 to-purple-500/20 border border-soc-accent/30 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
                  <Shield className="w-7 h-7 text-soc-accent" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-white tracking-tight">ThreatLens AI</h1>
                  <p className="text-xs text-soc-accent/80 font-medium tracking-wide uppercase">
                    AI-Powered Security Operations
                  </p>
                </div>
              </Link>
              <p className="text-sm text-gray-500 mt-3">See threats before they become incidents.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-panel p-6 sm:p-8 border border-soc-accent/20 shadow-[0_0_40px_rgba(34,211,238,0.06)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-soc-accent/[0.03] via-transparent to-purple-500/[0.04] pointer-events-none" />
              <div className="relative">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                  {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
