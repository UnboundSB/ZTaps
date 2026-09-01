import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const phrases = [
  "safe payments",
  "prompt injections",
  "rogue agents",
  "unexpected transactions",
  "secure autonomy"
];

const LandingPage = () => {
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 2500); // Change phrase every 2.5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center w-full relative z-10">
      {/* Hero Section */}
      <section className="min-h-[90vh] w-full max-w-6xl mx-auto flex flex-col justify-center items-center px-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center w-full"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[var(--text-primary)] font-display flex flex-col items-center justify-center">
            <span>Life gives you</span>
            <div className="h-[80px] overflow-hidden relative flex items-center justify-center mt-2 w-full max-w-[800px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPhrase}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -50, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "anticipate" }}
                  className="text-[var(--color-primary)] absolute"
                >
                  {phrases[currentPhrase]}
                </motion.span>
              </AnimatePresence>
            </div>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 mt-4">
            Zero-Trust AI Payment Sentinel (Z-TAPS) ensures every autonomous money action is explainable, bounded, and gated.
          </p>
          
          <div className="flex gap-6 justify-center">
            <Link to="/chat" className="px-8 py-4 btn-primary rounded-lg text-lg hover:scale-105 transition-transform">
              Launch Sentinel
            </Link>
            <Link to="/audit" className="px-8 py-4 glass-panel font-semibold hover:bg-[var(--glass-border)] transition-colors text-[var(--text-primary)]">
              View Audit Log
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Scroll Down Introduction */}
      <section className="min-h-screen w-full max-w-5xl mx-auto flex flex-col justify-center px-4 py-20 overflow-hidden">
        
        {/* Slide in from left */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-24 glass-panel p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--color-secondary)] font-display">
            The Agentic Era Requires Agentic Security
          </h2>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
            As autonomous agents begin executing tasks and making financial decisions on our behalf, traditional security perimeters dissolve. Z-TAPS acts as a <strong>Zero-Trust Gateway</strong> specifically designed for AI-driven workflows. We intercept, analyze, and authorize every action before it executes.
          </p>
        </motion.div>

        {/* Slide in from right */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-24 glass-panel p-8 md:p-12 ml-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[var(--color-primary)] font-display">
            Contextual Threat Detection
          </h2>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
            Not all malicious actions look like traditional malware. What happens when an LLM is prompt-injected into transferring funds? Z-TAPS utilizes advanced semantic analysis to detect <strong>logical anomalies</strong> and unauthorized intent in real-time, completely halting rogue agents.
          </p>
        </motion.div>

        {/* Slide up from bottom */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mt-12"
        >
          <h2 className="text-4xl font-bold mb-8 text-[var(--text-primary)] font-display">
            Ready to secure your agents?
          </h2>
          <Link to="/chat" className="px-10 py-5 btn-primary rounded-lg text-xl hover:scale-105 transition-transform inline-block">
            Try the Interactive Demo
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;
