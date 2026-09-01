import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParallaxBackground from './components/ParallaxBackground';

// Pages
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import AuditPage from './pages/AuditPage';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ztaps-theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ztaps-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <Router>
      <div className="relative w-full min-h-screen">
        {/* Background Layer (Persists across all routes) */}
        <ParallaxBackground theme={theme} />
        
        {/* Navigation (Persists across all routes) */}
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        <main className="relative z-10 w-full">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
