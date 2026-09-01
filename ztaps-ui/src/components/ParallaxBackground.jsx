import React, { useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const ParallaxBackground = ({ theme }) => {
  const { scrollYProgress } = useScroll();
  const location = useLocation();

  const isDark = theme === 'dark';

  // Determine horizontal "stage" based on route
  let routeIndex = 0;
  if (location.pathname.startsWith('/chat')) routeIndex = 1;
  else if (location.pathname.startsWith('/audit')) routeIndex = 2;

  // Vertical scroll morphing (Existing)
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const br1 = useTransform(scrollYProgress, [0, 1], ['50%', '10%']);
  const rot1 = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-50%']);
  const br2 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const rot2 = useTransform(scrollYProgress, [0, 1], [45, 180]);

  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '-150%']);
  const rot3 = useTransform(scrollYProgress, [0, 1], [0, -180]);

  const y4 = useTransform(scrollYProgress, [0, 1], ['0%', '80%']);
  const rot4 = useTransform(scrollYProgress, [0, 1], [-45, 90]);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none bg-[#FAFAFA]">
      
      {/* Sweeping Dark Mode Gradient Layer */}
      <motion.div
        initial={false}
        animate={{ x: isDark ? '0vw' : '-200vw' }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
        className="absolute top-0 bottom-0 left-0 w-[200vw] h-[100vh]"
        style={{
          background: 'linear-gradient(to right, #0D0814 0%, #0D0814 50%, transparent 100%)',
          zIndex: -5
        }}
      />
      
      {/* Cliché Cyber Grid Layer (Slowest) */}
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

      {/* Cliché Cyber Glowing Orb - Cyan (Medium Speed) */}
      <motion.div
        animate={{ x: routeIndex * -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 60 }}
        className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[var(--color-primary)] rounded-full opacity-10 blur-[150px] transition-colors duration-1000 ease-out"
      />

      {/* Cliché Cyber Glowing Orb - Purple (Medium-Fast Speed) */}
      <motion.div
        animate={{ x: routeIndex * -450 }}
        transition={{ type: 'spring', damping: 22, stiffness: 55 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--color-secondary)] rounded-full opacity-10 blur-[150px] transition-colors duration-1000 ease-out"
      />

      {/* Shape 1: Deep Slate */}
      <motion.div 
        animate={{ x: routeIndex * -200 }}
        transition={{ type: 'spring', damping: 25, stiffness: 70 }}
        style={{ y: y1, borderRadius: br1, rotate: rot1 }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-primary)] opacity-30 transition-colors duration-1000 ease-out"
      />

      {/* Shape 1.5: Deep Slate (Right side) */}
      <motion.div 
        animate={{ x: routeIndex * -150 }}
        transition={{ type: 'spring', damping: 25, stiffness: 70 }}
        style={{ y: y1, borderRadius: br1, rotate: rot1 }}
        className="absolute top-1/2 -right-32 w-64 h-64 bg-[var(--color-primary)] opacity-20 transition-colors duration-1000 ease-out"
      />

      {/* Shape 2: Soft Peach */}
      <motion.div 
        animate={{ x: routeIndex * 150 }}
        transition={{ type: 'spring', damping: 30, stiffness: 50 }}
        style={{ y: y2, borderRadius: br2, rotate: rot2 }}
        className="absolute top-1/4 -right-20 w-80 h-80 bg-[var(--color-secondary)] opacity-30 transition-colors duration-1000 ease-out"
      />

      {/* Shape 2.5: Soft Peach (Left side) */}
      <motion.div 
        animate={{ x: routeIndex * 250 }}
        transition={{ type: 'spring', damping: 30, stiffness: 50 }}
        style={{ y: y2, borderRadius: br2, rotate: rot2 }}
        className="absolute bottom-1/4 -left-40 w-96 h-96 bg-[var(--color-secondary)] opacity-20 transition-colors duration-1000 ease-out"
      />

      {/* Shape 3: Soft Blue/Grey Hollow Square */}
      <motion.div 
        animate={{ x: routeIndex * 200 }}
        transition={{ type: 'spring', damping: 20, stiffness: 60 }}
        style={{ y: y3, rotate: rot3 }}
        className="absolute bottom-1/4 left-1/4 w-72 h-72 border-[24px] border-[var(--color-tertiary)] opacity-30 transition-colors duration-1000 ease-out"
      />

      {/* Shape 4: Cream/Warm Semi-Circle */}
      <motion.div 
        animate={{ x: routeIndex * -300 }}
        transition={{ type: 'spring', damping: 28, stiffness: 80 }}
        style={{ y: y4, rotate: rot4, borderTopLeftRadius: '250px', borderTopRightRadius: '250px' }}
        className="absolute -bottom-40 right-1/4 w-[500px] h-[250px] bg-[var(--color-warm)] transition-colors duration-1000 ease-out opacity-40"
      />
      
      {/* Shape 5: Center subtle accent */}
      <motion.div 
        animate={{ x: routeIndex * 100 }}
        transition={{ type: 'spring', damping: 40, stiffness: 30 }}
        style={{ rotate: scrollYProgress }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-2 border-[var(--color-primary)] opacity-5 transition-colors duration-1000 ease-out"
      />

    </div>
  );
};

export default ParallaxBackground;
