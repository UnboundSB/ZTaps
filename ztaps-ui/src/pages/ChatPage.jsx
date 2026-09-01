import React from 'react';
import AgentChat from '../components/AgentChat';
import { motion } from 'framer-motion';

const ChatPage = () => {
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
            Interactive <span className="text-[var(--color-primary)]">Agent Demo</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Interact with the autonomous agent. All financial actions are intercepted by Z-TAPS.
          </p>
        </div>
        
        <AgentChat />
      </motion.div>
    </div>
  );
};

export default ChatPage;
