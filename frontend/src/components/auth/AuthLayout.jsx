import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthScene from './AuthScene';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <AuthScene />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-soc-accent/30 to-purple-500/20 border border-soc-accent/30 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
              <Shield className="w-7 h-7 text-soc-accent" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">ThreatLens AI</h1>
              <p className="text-xs text-soc-accent/80 font-medium tracking-wide uppercase">
                AI-Powered Security Operations Intelligence
              </p>
            </div>
          </Link>
          <p className="text-sm text-gray-500 mt-4">See threats before they become incidents.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel p-6 lg:p-8 border-soc-border-bright/30"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
