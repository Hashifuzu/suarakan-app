import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeApp from './EmployeeApp';
import HRDashboard from './HRDashboard';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/hr') || window.location.search.includes('view=hr')) {
        return 'hr';
      }
    }
    return 'employee';
  });

  // Intro Entrance Animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/hr') || window.location.search.includes('view=hr')) {
        setCurrentView('hr');
      } else {
        setCurrentView('employee');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    const newUrl = view === 'hr' ? '/hr' : '/';
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="relative min-h-screen bg-[#050b14] overflow-hidden">
      {/* INTRO SPLASH / ENTRANCE ANIMATION */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-none select-none p5-dots"
          >
            {/* Center Slanted Blue Banner */}
            <motion.div
              initial={{ x: "-100%", skewX: -12 }}
              animate={{ x: 0, skewX: -6 }}
              exit={{ x: "100%", skewX: 12 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="bg-[#0066FF] text-white border-2 sm:border-4 border-white px-5 sm:px-16 py-3 sm:py-4 shadow-[4px_4px_0px_#000] sm:shadow-[8px_8px_0px_#000] flex items-center gap-2 sm:gap-4 max-w-[90vw]"
            >
              <div className="bg-[#0B0E14] text-[#00d2ff] font-black text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase -rotate-2 border border-white shrink-0">
                SUARAKAN
              </div>
              <div className="text-xl sm:text-4xl md:text-5xl font-black italic tracking-tighter uppercase drop-shadow-[2px_2px_0px_#000] truncate">
                MEMBUKA RUANG ASPIRASI...
              </div>
            </motion.div>

            {/* Subtext */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="mt-6 font-mono text-xs tracking-widest text-[#00d2ff] uppercase flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />
              <span>SUARAKAN // SISTEM USULAN & ASPIRASI RAHASIA KARYAWAN</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Fade/Slide In */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {/* Render selected view */}
        {currentView === 'hr' ? (
          <HRDashboard navigateTo={navigateTo} currentView={currentView} />
        ) : (
          <EmployeeApp navigateTo={navigateTo} currentView={currentView} />
        )}
      </motion.div>
    </div>
  );
}
