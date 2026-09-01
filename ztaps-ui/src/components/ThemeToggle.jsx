import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-24 h-12 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-[600ms] ease-out overflow-hidden shadow-inner flex-shrink-0 ${
        isDark ? 'bg-[#1D2A4C]' : 'bg-[#70C1FF]'
      }`}
      style={{
        boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.4)',
      }}
      aria-label="Toggle Theme"
    >
      {/* Background Elements (Clouds / Stars / Glow) */}
      <AnimatePresence initial={false}>
        {!isDark ? (
          // Day - Clouds
          <motion.div
            key="clouds"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Right-most cloud (most opaque) */}
            <div className="theme-cloud absolute -bottom-1 right-1 opacity-100 scale-[0.85] origin-bottom-right" />
            
            {/* Middle cloud (partially transparent) */}
            <div className="theme-cloud absolute -bottom-1 right-8 opacity-60 scale-[0.65] origin-bottom-right" />
            
            {/* Left-most cloud (most transparent) */}
            <div className="theme-cloud absolute -bottom-1 right-14 opacity-30 scale-[0.45] origin-bottom-right" />
          </motion.div>
        ) : (
          // Night - Stars & Moon Glow
          <motion.div
            key="stars"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none overflow-visible"
          >
            {/* Moon Glow Rings (positioned where the moon will be on the right) */}
            <div className="absolute top-1/2 right-1 -translate-y-1/2 w-14 h-14 bg-white/10 rounded-full blur-[2px]" />
            <div className="absolute top-1/2 right-[-0.5rem] -translate-y-1/2 w-20 h-20 bg-white/5 rounded-full blur-[4px]" />

            {/* Stars */}
            <div className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute top-7 left-5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-2 left-10 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-3 left-4 w-1 h-1 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
            <div className="absolute bottom-2 left-10 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            
            {/* Four-point Stars */}
            <div className="absolute top-4 left-8 w-2 h-2 text-white flex justify-center items-center opacity-90">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
            </div>
            <div className="absolute top-7 left-14 w-2 h-2 text-white flex justify-center items-center opacity-70 scale-75">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Knob (Sun / Moon) */}
      <motion.div
        layout
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
        className={`z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden ${
          isDark ? 'bg-[#D1D5DB] ml-auto' : 'bg-[#FFD100]'
        }`}
        style={{
          boxShadow: isDark 
            ? 'inset -2px -4px 6px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.3)' 
            : 'inset -2px -4px 6px rgba(230,138,0,0.6), 0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        {/* Moon Craters (Only visible in dark mode) */}
        <AnimatePresence>
          {isDark && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Crater 1 (Large) */}
              <div className="absolute top-1.5 left-2.5 w-3 h-3 bg-[#9CA3AF] rounded-full opacity-80" style={{ boxShadow: 'inset 1px 2px 3px rgba(0,0,0,0.3)' }} />
              {/* Crater 2 (Medium) */}
              <div className="absolute bottom-2 left-1.5 w-2 h-2 bg-[#9CA3AF] rounded-full opacity-80" style={{ boxShadow: 'inset 1px 1.5px 2px rgba(0,0,0,0.3)' }} />
              {/* Crater 3 (Small) */}
              <div className="absolute bottom-3 right-1.5 w-1.5 h-1.5 bg-[#9CA3AF] rounded-full opacity-80" style={{ boxShadow: 'inset 1px 1px 1.5px rgba(0,0,0,0.3)' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
