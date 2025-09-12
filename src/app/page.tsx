'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Dashboard from './dashboard/page';
import StartupPopup from './components/StartupPopup';

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<'landing' | 'dashboard'>('landing');
  const [showStartup, setShowStartup] = useState(false);

  // ✅ Store verified API Key instead of JAL ID
  const [apiKey, setApiKey] = useState<string>('');

  const flight = { dpt: 'Japan', arr: 'Airline Virtual' };

  // Initial cookie check (keep your existing session logic if any)
  useEffect(() => {
    setAuthed(document.cookie.includes('jal_session='));
  }, []);

  // Mask API key for UI display (don’t leak full key into the console popup)
  const maskedKey = useMemo(() => {
    if (!apiKey) return '';
    const trimmed = apiKey.trim();
    if (trimmed.length <= 8) return '••••';
    // show first 4 and last 4
    return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
  }, [apiKey]);

  // Called by LandingPage after successful key verification
  const handleEnter = (key: string) => {
    setApiKey(key);       // ✅ save API key
    setShowStartup(true); // ✅ show startup console
  };

  const slideVariants = {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  };

  if (authed === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p>Checking boarding pass…</p>
      </div>
    );
  }

  return (
    <main className="w-full h-full overflow-hidden relative">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <motion.div
            key="landing"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={`w-full h-full transition ${showStartup ? 'blur-sm brightness-75' : ''}`}
          >
            {/* ✅ LandingPage now returns API Key via onEnter */}
            <LandingPage onEnter={handleEnter} flight={flight} />
          </motion.div>
        )}

        {screen === 'dashboard' && (
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

      {/* Dim background overlay while booting */}
      {showStartup && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40" />}

      {/* Boot console popup */}
      {showStartup && (
        <StartupPopup
          // ⚠️ Back-compat: StartupPopup still expects `jalId`.
          // We pass a masked API key so UI remains friendly without exposing secrets.
          jalId={maskedKey}
          onFinish={() => {
            setShowStartup(false);
            setScreen('dashboard');
          }}
        />
      )}
    </main>
  );
}
