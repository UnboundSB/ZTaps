import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, ArrowUp, CornerDownLeft } from 'lucide-react';

const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
  ['?123', ',', 'Space', '.', 'Enter']
];

const VirtualKey = ({ keyChar, isPressed, onKeyClick }) => {
  // Determine if it's a special key
  const isSpecial = ['Shift', 'Backspace', 'Enter', '?123', 'Space'].includes(keyChar);
  const displayChar = 
    keyChar === 'Shift' ? <ArrowUp size={18} /> :
    keyChar === 'Backspace' ? <Delete size={18} /> :
    keyChar === 'Enter' ? <CornerDownLeft size={18} /> :
    keyChar === 'Space' ? '' :
    keyChar;

  // Layout sizing
  let widthClass = 'flex-1';
  if (keyChar === 'Space') widthClass = 'flex-[3]';
  if (isSpecial && keyChar !== 'Space') widthClass = 'flex-[1.5]';

  return (
    <div className={`relative flex justify-center ${widthClass}`}>
      {/* The Android Popup Bubble */}
      <AnimatePresence>
        {isPressed && !isSpecial && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1.2, y: -45 }}
            exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.15 } }}
            className="absolute z-50 pointer-events-none"
          >
            <div className="relative flex items-center justify-center w-12 h-14 bg-[var(--bg-secondary)] border border-[var(--glass-border)] rounded-lg shadow-xl font-bold text-xl text-[var(--text-primary)]">
              {displayChar}
              {/* Bubble tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--bg-secondary)] border-b border-r border-[var(--glass-border)] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Physical Key */}
      <motion.button
        onPointerDown={(e) => { e.preventDefault(); onKeyClick(keyChar); }}
        animate={{
          scale: isPressed ? 0.92 : 1,
          backgroundColor: isPressed 
            ? 'var(--color-primary)' 
            : isSpecial 
              ? 'var(--bg-secondary)' 
              : 'var(--bg-primary)'
        }}
        transition={{ duration: 0.05 }}
        className={`w-full h-12 mx-[2px] rounded-md shadow-sm border border-[var(--glass-border)] flex items-center justify-center font-medium text-[var(--text-primary)] ${isPressed ? 'text-white' : ''} touch-none`}
      >
        {displayChar}
      </motion.button>
    </div>
  );
};

const VirtualKeyboard = ({ onKeyPress }) => {
  const [activeKeys, setActiveKeys] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      let key = e.key;
      if (key === ' ') key = 'Space';
      if (key.length === 1) key = key.toLowerCase();
      
      setActiveKeys(prev => ({ ...prev, [key]: true }));
    };

    const handleKeyUp = (e) => {
      let key = e.key;
      if (key === ' ') key = 'Space';
      if (key.length === 1) key = key.toLowerCase();

      setActiveKeys(prev => ({ ...prev, [key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full bg-[#E5E7EB] dark:bg-[#1A1A1A] p-2 pb-6 flex flex-col gap-2 rounded-b-3xl select-none relative z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className={`flex justify-center w-full px-1 ${rowIndex === 1 ? 'px-4' : ''}`}>
          {row.map((keyChar) => (
            <VirtualKey 
              key={keyChar} 
              keyChar={keyChar} 
              isPressed={!!activeKeys[keyChar]}
              onKeyClick={onKeyPress}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default VirtualKeyboard;
