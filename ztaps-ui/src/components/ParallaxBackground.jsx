import React, { useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Highly optimized solid 3D shape using continuous blob morphing
const SolidShape = ({ yOffset, delay, x, baseColor, className, style, isDark }) => {
  // Constant light source box-shadow
  const staticShadow = isDark 
    ? `30px 30px 60px rgba(0,0,0,0.6), inset 10px 10px 20px rgba(255,255,255,0.2), inset -10px -10px 30px rgba(0,0,0,0.5)` 
    : `30px 30px 60px rgba(0,0,0,0.25), inset 15px 15px 30px rgba(255,255,255,0.9), inset -15px -15px 30px rgba(0,0,0,0.15)`;
    
  return (
    <motion.div 
        animate={{ 
          x: [x, x + 30, x - 20, x],
          y: [yOffset, yOffset - 40, yOffset + 20, yOffset],
          borderRadius: [
            '40% 60% 70% 30% / 40% 50% 60% 50%',
            '60% 40% 30% 70% / 60% 30% 70% 40%',
            '50% 50% 60% 40% / 50% 60% 40% 60%',
            '40% 60% 70% 30% / 40% 50% 60% 50%'
          ]
        }}
        transition={{ 
          duration: 15, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: delay 
        }}
        style={{ 
          boxShadow: staticShadow,
          backgroundColor: `var(--color-${baseColor})`,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.6)',
          ...style 
        }}
        className={`absolute ${className}`}
    />
  );
};

// Hyper-optimized acrylic frame shape
const FrameShape = ({ yOffset, delay, x, bw, baseColor, className, isDark }) => {
  const outerShadow = isDark ? `30px 30px 60px rgba(0,0,0,0.6)` : `30px 30px 60px rgba(0,0,0,0.2)`;
  const innerShadow = isDark 
    ? `inset 10px 10px 20px rgba(255,255,255,0.2), inset -10px -10px 20px rgba(0,0,0,0.5)` 
    : `inset 15px 15px 30px rgba(255,255,255,0.9), inset -15px -15px 30px rgba(0,0,0,0.1)`;
  const glow = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)';

  return (
    <motion.div 
        animate={{ 
          x: [x, x - 30, x + 20, x],
          y: [yOffset, yOffset + 40, yOffset - 20, yOffset],
          borderRadius: [
            '60% 40% 30% 70% / 60% 30% 70% 40%',
            '40% 60% 70% 30% / 40% 50% 60% 50%',
            '50% 50% 60% 40% / 50% 60% 40% 60%',
            '60% 40% 30% 70% / 60% 30% 70% 40%'
          ]
        }}
        transition={{ 
          duration: 18, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: delay 
        }}
        style={{ boxShadow: outerShadow }}
        className={`absolute ${className}`}
    >
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{
          border: `${bw}px solid var(--color-${baseColor})`,
          borderRadius: 'inherit',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: `${innerShadow}, inset 0 0 0 1px ${glow}`
        }}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

const ParallaxBackground = ({ theme }) => {
  const location = useLocation();
  const isDark = theme === 'dark';

  let routeIndex = 0;
  if (location.pathname.startsWith('/chat')) routeIndex = 1;
  else if (location.pathname.startsWith('/audit')) routeIndex = 2;

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none bg-transparent transition-colors duration-500">
      
      {/* Sweeping Dark Mode Gradient Layer */}
      <motion.div
        initial={false}
        animate={{ x: isDark ? '-66.666%' : '0%' }}
        transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 1.2 }}
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          width: '300vw',
          left: 0,
          background: 'linear-gradient(90deg, rgba(13,8,20,0) 0%, rgba(13,8,20,0) 33.33%, #0D0814 66.66%, #1A1025 100%)',
          zIndex: -5
        }}
      />
      
      {/* Cyber Grid Layer */}
      <motion.div
        animate={{ x: routeIndex * -50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 40 }}
        className="absolute inset-0 w-[200vw] h-[200vh] -top-[50vh] -left-[50vw]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          opacity: 0.03,
          transform: 'perspective(1000px) rotateX(60deg)'
        }}
      />

      {/* Cyber Glowing Orbs */}
      <motion.div
        animate={{ x: routeIndex * -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 60 }}
        className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[var(--color-primary)] rounded-full opacity-10 blur-[150px] transition-colors duration-500 ease-out"
      />
      <motion.div
        animate={{ x: routeIndex * -450 }}
        transition={{ type: 'spring', damping: 22, stiffness: 55 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--color-secondary)] rounded-full opacity-10 blur-[150px] transition-colors duration-500 ease-out"
      />

      {/* Shape 1: Deep Slate */}
      <SolidShape 
        x={routeIndex * -200} yOffset={100} delay={0} isDark={isDark}
        baseColor="primary" 
        className="-top-32 -left-32 w-96 h-96 opacity-90" 
      />

      {/* Shape 1.5: Deep Slate (Right side) */}
      <SolidShape 
        x={routeIndex * -150} yOffset={300} delay={2} isDark={isDark}
        baseColor="primary" 
        className="top-1/2 -right-32 w-64 h-64 opacity-80" 
      />

      {/* Shape 2: Soft Peach */}
      <SolidShape 
        x={routeIndex * 150} yOffset={200} delay={1} isDark={isDark}
        baseColor="secondary" 
        className="top-1/4 -right-20 w-80 h-80 opacity-90" 
      />

      {/* Shape 2.5: Soft Peach (Left side) */}
      <SolidShape 
        x={routeIndex * 250} yOffset={500} delay={3} isDark={isDark}
        baseColor="secondary" 
        className="bottom-1/4 -left-40 w-96 h-96 opacity-80" 
      />

      {/* Shape 3: Soft Blue/Grey Hollow Square Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * 200} yOffset={400} delay={1.5} isDark={isDark}
        bw={36} baseColor="tertiary"
        className="bottom-1/4 left-1/4 w-72 h-72 opacity-90" 
      />

      {/* Shape 5: Circle Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * -150} yOffset={150} delay={2.5} isDark={isDark}
        bw={24} baseColor="warm"
        className="top-32 left-[35%] w-48 h-48 opacity-85" 
      />

      {/* Shape 6: Small Hollow Square Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * 180} yOffset={80} delay={0.5} isDark={isDark}
        bw={20} baseColor="primary"
        className="top-20 right-10 w-32 h-32 opacity-90" 
      />

      {/* Shape 4: Cream/Warm Semi-Circle */}
      <SolidShape 
        x={routeIndex * -300} yOffset={600} delay={3.5} isDark={isDark}
        baseColor="warm" 
        className="-bottom-40 right-1/4 w-[500px] h-[400px] opacity-90" 
      />
      
    </div>
  );
};

export default ParallaxBackground;
