import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';
import ApiKeyModal from './ApiKeyModal';

const Navbar = ({ theme, toggleTheme }) => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      <div className="glass-panel mx-4 mt-4 px-6 py-4 flex justify-between items-center">
        
        {/* Logo Area */}
        <Link to="/" className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-[var(--color-primary)]" />
          <span className="text-xl font-bold tracking-wider text-[var(--text-primary)] font-display">
            Z-TAPS
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-8 items-center">
          <Link to="/" className="text-sm font-semibold hover:text-[var(--color-secondary)] transition-colors">Vision</Link>
          <Link to="/chat" className="text-sm font-semibold hover:text-[var(--color-secondary)] transition-colors">Agent Chat</Link>
          <Link to="/audit" className="text-sm font-semibold hover:text-[var(--color-secondary)] transition-colors">Audit Log</Link>
          <button 
            onClick={() => setIsApiModalOpen(true)}
            className="btn-primary px-4 py-2 rounded text-sm"
          >
            Get API Key
          </button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <ApiKeyModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;
