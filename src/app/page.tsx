'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';

export default function HomePage() {
  const [entered, setEntered] = useState(false);
  const flight = { dpt: 'Japan', arr: 'Airline Virtual' };

  const slideVariants = {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  };

  return (
    <main className="w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.div
            key="landing"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <LandingPage onEnter={() => setEntered(true)} flight={flight} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
