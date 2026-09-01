import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Copy, CheckCircle, CreditCard, X } from 'lucide-react';

const ApiKeyModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCheckout = () => {
    // Mock Razorpay integration for now
    setStep(2);
    setTimeout(() => {
      setApiKey('ZTAPS-' + Math.random().toString(36).substring(2, 15).toUpperCase());
      setStep(3);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
          >
            <div className="glass-panel p-8 relative overflow-hidden">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--color-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-[var(--color-primary)]/20 rounded-xl">
                  <Key className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-bold font-display">Get API Key</h2>
              </div>

              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-[var(--text-secondary)] mb-6 text-sm">
                    Unlock enterprise-grade agentic security. You are purchasing a standard developer license.
                  </p>
                  
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-xl mb-6 border border-[var(--glass-border)]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Developer Tier</span>
                      <span className="text-[var(--color-primary)] font-bold">₹999 / mo</span>
                    </div>
                    <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                      <li>• 10,000 requests / month</li>
                      <li>• Real-time prompt injection filtering</li>
                      <li>• Standard support</li>
                    </ul>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center space-x-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition-opacity"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Pay with Razorpay (Test)</span>
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-8 space-y-4"
                >
                  <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  <p className="font-semibold animate-pulse text-[var(--color-primary)]">Processing Payment...</p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-center font-bold text-xl mb-2">Payment Successful!</h3>
                  <p className="text-center text-[var(--text-secondary)] text-sm mb-6">
                    Here is your new Z-TAPS API Key. Keep it secret, keep it safe.
                  </p>

                  <div className="relative group cursor-pointer" onClick={copyToClipboard}>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--glass-border)] font-mono text-sm break-all pr-12">
                      {apiKey}
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--bg-primary)] rounded-lg shadow-sm group-hover:text-[var(--color-primary)] transition-colors">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </div>
                  </div>
                  {copied && (
                    <p className="text-green-500 text-xs text-center mt-2 font-semibold">Copied to clipboard!</p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApiKeyModal;
