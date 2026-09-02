import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Highly optimized solid 3D shape using a wrapper for stationary drop-shadows
const SolidShape = ({ y, rot, x, baseColor, className, borderRadius, style, isDark }) => {
  // Static inset shadows (they rotate with the object, like physical bevels)
  const insets = isDark 
    ? `inset 5px 5px 15px rgba(255,255,255,0.2), inset -5px -5px 20px rgba(0,0,0,0.6)`
    : `inset 10px 10px 25px rgba(255,255,255,0.95), inset -10px -10px 25px rgba(0,0,0,0.15)`;
  
  // Static drop shadow on the wrapper (stays stationary, global light source)
  const dropShadow = isDark
    ? `drop-shadow(25px 35px 30px rgba(0,0,0,0.7))`
    : `drop-shadow(25px 35px 30px rgba(0,0,0,0.3))`;

  return (
    <motion.div 
        animate={{ x }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: 'spring', damping: 25, stiffness: 60 }}
        style={{ y, filter: dropShadow, pointerEvents: 'auto' }}
        className={`absolute ${className} cursor-pointer`}
    >
      <motion.div
        style={{
          width: '100%', height: '100%',
          rotate: rot, 
          borderRadius, 
          boxShadow: insets,
          backgroundColor: `var(--color-${baseColor})`,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.6)',
          ...style
        }}
      />
    </motion.div>
  );
};

// Hyper-optimized acrylic frame shape
const FrameShape = ({ y, rot, x, bw, baseColor, className, borderRadius = '0px', isDark }) => {
  const insets = isDark 
    ? `inset 5px 5px 15px rgba(255,255,255,0.2), inset -5px -5px 15px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)`
    : `inset 5px 5px 20px rgba(255,255,255,1), inset -5px -5px 15px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.8)`;
    
  const dropShadow = isDark
    ? `drop-shadow(25px 35px 30px rgba(0,0,0,0.7))`
    : `drop-shadow(25px 35px 30px rgba(0,0,0,0.3))`;

  return (
    <motion.div 
        animate={{ x }}
        whileHover={{ scale: 1.05, rotate: -5 }}
        transition={{ type: 'spring', damping: 20, stiffness: 60 }}
        style={{ y, filter: dropShadow, pointerEvents: 'auto' }}
        className={`absolute ${className} cursor-pointer`}
    >
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        style={{
          border: `${bw}px solid var(--color-${baseColor})`,
          rotate: rot,
          borderRadius,
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: insets
        }}
      >
         <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

const ParallaxBackground = ({ theme }) => {
  const { scrollYProgress } = useScroll();
  // Lowered damping/mass to fix prolonged background calculation lag while keeping it smooth
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 50, mass: 1.2 });
  const location = useLocation();

  const isDark = theme === 'dark';

  // Determine horizontal "stage" based on route
  let routeIndex = 0;
  if (location.pathname.startsWith('/chat')) routeIndex = 1;
  else if (location.pathname.startsWith('/audit')) routeIndex = 2;

  // Vertical scroll morphing using smoothProgress
  const y1 = useTransform(smoothProgress, [0, 1], ['0%', '100%']);
  const br1 = useTransform(smoothProgress, [0, 1], ['50%', '10%']);
  const rot1 = useTransform(smoothProgress, [0, 1], [0, 90]);

  const y2 = useTransform(smoothProgress, [0, 1], ['0%', '-50%']);
  const br2 = useTransform(smoothProgress, [0, 1], ['0%', '50%']);
  const rot2 = useTransform(smoothProgress, [0, 1], [45, 180]);

  const y3 = useTransform(smoothProgress, [0, 1], ['0%', '-150%']);
  const rot3 = useTransform(smoothProgress, [0, 1], [0, -180]);

  const y4 = useTransform(smoothProgress, [0, 1], ['0%', '80%']);
  const rot4 = useTransform(smoothProgress, [0, 1], [-45, 90]);
  
  const y5 = useTransform(smoothProgress, [0, 1], ['0%', '-100%']);
  const rot5 = useTransform(smoothProgress, [0, 1], [30, 210]);

  const y6 = useTransform(smoothProgress, [0, 1], ['0%', '120%']);
  const rot6 = useTransform(smoothProgress, [0, 1], [-20, -100]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-transparent transition-colors duration-500 pointer-events-none">
      
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
        x={routeIndex * -200} y={y1} rot={rot1} isDark={isDark}
        borderRadius={br1} baseColor="primary" 
        className="-top-32 -left-32 w-96 h-96 opacity-90" 
      />

      {/* Shape 1.5: Deep Slate (Right side) */}
      <SolidShape 
        x={routeIndex * -150} y={y1} rot={rot1} isDark={isDark}
        borderRadius={br1} baseColor="primary" 
        className="top-1/2 -right-32 w-64 h-64 opacity-80" 
      />

      {/* Shape 2: Soft Peach */}
      <SolidShape 
        x={routeIndex * 150} y={y2} rot={rot2} isDark={isDark}
        borderRadius={br2} baseColor="secondary" 
        className="top-1/4 -right-20 w-80 h-80 opacity-90" 
      />

      {/* Shape 2.5: Soft Peach (Left side) */}
      <SolidShape 
        x={routeIndex * 250} y={y2} rot={rot2} isDark={isDark}
        borderRadius={br2} baseColor="secondary" 
        className="bottom-1/4 -left-40 w-96 h-96 opacity-80" 
      />

      {/* Shape 3: Soft Blue/Grey Hollow Square Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * 200} y={y3} rot={rot3} isDark={isDark}
        bw={36} baseColor="tertiary" borderRadius="30px"
        className="bottom-1/4 left-1/4 w-72 h-72 opacity-90" 
      />

      {/* Shape 5: Circle Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * -150} y={y5} rot={rot5} isDark={isDark}
        bw={24} baseColor="warm" borderRadius="50%"
        className="top-32 left-[35%] w-48 h-48 opacity-85" 
      />

      {/* Shape 6: Small Hollow Square Frame (Acrylic Glass Center) */}
      <FrameShape 
        x={routeIndex * 180} y={y6} rot={rot6} isDark={isDark}
        bw={20} baseColor="primary" borderRadius="20px"
        className="top-20 right-10 w-32 h-32 opacity-90" 
      />

      {/* Shape 4: Cream/Warm Semi-Circle */}
      <SolidShape 
        x={routeIndex * -300} y={y4} rot={rot4} isDark={isDark}
        style={{ borderTopLeftRadius: '250px', borderTopRightRadius: '250px' }} baseColor="warm" 
        className="-bottom-40 right-1/4 w-[500px] h-[250px] opacity-90" 
      />
      
    </div>
  );
};

export default ParallaxBackground;
