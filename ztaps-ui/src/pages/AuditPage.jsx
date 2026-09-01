import React from 'react';
import AuditTrail from '../components/AuditTrail';
import { motion } from 'framer-motion';

const AuditPage = () => {
  return (
    <div className="w-full relative z-10 flex flex-col items-center min-h-screen pt-24 px-4 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-7xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] font-display mb-4">
            Z-TAPS <span className="text-[var(--color-secondary)]">Audit Log</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            A real-time, immutable ledger of all agent transactions intercepted by the firewall.
          </p>
        </div>
        
        <AuditTrail />
      </motion.div>
    </div>
  );
};

export default AuditPage;
