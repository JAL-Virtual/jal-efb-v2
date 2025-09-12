'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export type FlightInfo = {
  dpt?: string;
  arr?: string;
  flightNumber?: string;
};

export type LandingPageProps = {
  onEnter: () => void;
  flight?: FlightInfo;
};

type Star = {
  top: number; left: number; w: number; h: number; dur: number; delay: number;
};
type Particle = {
  top: number; left: number; w: number; h: number; dur: number; delay: number; dx: number; dy: number;
};

// deterministic-ish RNG helper (stable per mount, never during SSR)
function makeStars(count: number): Star[] {
  return Array.from({ length: count }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    w: Math.random() * 3 + 1,
    h: Math.random() * 3 + 1,
    dur: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }));
}
function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }).map(() => ({
    top: Math.random() * 100,
    left: Math.random() * 100,
    w: Math.random() * 6 + 2,
    h: Math.random() * 6 + 2,
    dur: Math.random() * 5 + 5,
    delay: Math.random() * 3,
    dx: Math.random() * 100 - 50,
    dy: Math.random() * 100 - 50,
  }));
}

export default function LandingPage({ onEnter, flight }: LandingPageProps) {
  // -------- SSR-safe mount gate --------
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // -------- Time (no Date at SSR) ------
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const formattedTime = useMemo(
    () => (currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'),
    [currentTime]
  );

  // -------- Auth (render stable at SSR) --------
  const [session, setSession] = useState<Session | null>(null);
  const user: User | null = session?.user ?? null;
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleDiscordLogin = async () => {
    try {
      setAuthBusy(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
          scopes: 'identify email',
        },
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      alert('Discord login failed. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // -------- UI states --------
  const [shake, setShake] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Generate stars/particles AFTER mount only (so SSR markup is stable)
  const [stars, setStars] = useState<Star[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    if (!mounted) return;
    setStars(makeStars(50));
    const t = setTimeout(() => {
      setParticles(makeParticles(15));
      setShowParticles(true);
    }, 500);
    return () => clearTimeout(t);
  }, [mounted]);

  // Safe fallback if no flight is passed
  const safeFlight = flight || { dpt: 'NOW', arr: 'HERE', flightNumber: 'IFE-2024' };

  const handleStart = (e: React.MouseEvent) => {
    if (!session) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    onEnter();
  };

  // Auth header UI
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata as any)?.name || user?.email || 'Guest';

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Static gradient (SSR-safe) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-black/70 z-0" />

      {/* Stars: render only after mount */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {mounted &&
          stars.map((s, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.w, height: s.h }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
              transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
            />
          ))}
      </div>

      {/* Particles: also after mount */}
      <AnimatePresence>
        {mounted && showParticles && (
          <>
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/30"
                style={{ top: `${p.top}%`, left: `${p.left}%`, width: p.w, height: p.h }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], x: p.dx, y: p.dy }}
                transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Background image (SSR-safe) */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <Image
          src="/Images/ife-galaxy.jpg"
          alt="IFE Background"
          fill
          priority
          style={{ objectFit: 'cover' }}
          className="pointer-events-none select-none"
        />
      </motion.div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-purple-900/20 to-black/80 z-0" />

      {/* Decorative lines (static) */}
      <div className="absolute top-20 right-0 w-48 h-1 bg-white/50 rotate-45 origin-right" />
      <div className="absolute bottom-20 left-0 w-48 h-1 bg-white/50 -rotate-45 origin-left" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 px-6 text-center">
        {/* Top bar: time (left) + auth (right) */}
        <div className="w-full flex justify-between items-start">
          <motion.div
            className="text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="text-2xl font-light">
              <time suppressHydrationWarning>{formattedTime}</time>
            </div>
            <div className="text-sm text-gray-300 mt-1">Local Time</div>
          </motion.div>

          <motion.div
            className="text-right flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {/* SSR renders the login button by default; after mount+session we switch to user chip (no hydration mismatch) */}
            {mounted && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="avatar" width={24} height={24} className="rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20" />
                  )}
                  <span className="text-sm font-medium max-w-[10rem] truncate" title={displayName}>
                    {displayName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDiscordLogin}
                disabled={authBusy}
                className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[#5865F2] hover:brightness-110 disabled:opacity-60 transition shadow-md"
                aria-label="Login with Discord"
              >
                {/* Discord mark */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M20.317 4.369A19.791 19.791 0 0016.558 3c-.2.363-.43.85-.589 1.231a18.27 18.27 0 00-4-.002c-.16-.382-.39-.87-.59-1.232A19.736 19.736 0 003.68 4.37C1.85 7.335 1.352 10.2 1.533 13.03c1.676 1.24 3.3 1.997 4.879 2.496.39-.535.739-1.11 1.04-1.717-.572-.217-1.12-.48-1.64-.786.137-.1.27-.205.399-.313 3.169 1.49 6.6 1.49 9.72 0 .13.108.263.213.399.313-.52.307-1.068.57-1.64.786.3.606.65 1.181 1.04 1.717 1.58-.5 3.204-1.257 4.88-2.497.238-3.62-.61-6.46-2.393-8.662zM9.295 12.348c-.949 0-1.724-.86-1.724-1.92s.761-1.927 1.724-1.927c.963 0 1.738.868 1.724 1.927 0 1.06-.761 1.92-1.724 1.92zm5.41 0c-.949 0-1.724-.86-1.724-1.92s.761-1.927 1.724-1.927c.963 0 1.738.868 1.724 1.927 0 1.06-.761 1.92-1.724 1.92z"/>
                </svg>
                <span className="text-white font-semibold">Login with Discord</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* Headline + route */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-wider mb-6">WELCOME ABOARD</h1>

            <div className="relative flex items-center justify-center my-10">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/60" />
              <motion.div className="mx-4" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 11.5L12 3L6.5 11.5L12 9.5L17.5 11.5Z" stroke="white" strokeWidth="1.5"/>
                  <path d="M12 21L17.5 11.5L12 9.5L6.5 11.5L12 21Z" stroke="white" strokeWidth="1.5"/>
                </svg>
              </motion.div>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/60" />
            </div>

            <motion.div className="mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                {safeFlight.dpt} <span className="text-blue-300 mx-2">→</span> {safeFlight.arr}
              </h2>
            </motion.div>
          </motion.div>

          {/* START (gated by auth) */}
          <motion.button
            type="button"
            onClick={handleStart}
            onMouseEnter={() => { setShake(true); setTimeout(() => setShake(false), 600); }}
            className={`group relative px-10 py-4 rounded-full font-semibold overflow-hidden transition ${session ? 'bg-gradient-to-b from-blue-600 to-blue-800' : 'bg-gray-600 cursor-not-allowed'}`}
            whileHover={session ? { y: -4, scale: 1.05 } : undefined}
            whileTap={session ? { scale: 0.95 } : undefined}
            initial={{ opacity: 0, y: 20 }}
            animate={{ ...(shake ? { x: [-6, 6, -4, 4, 0] } : {}), opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            aria-disabled={!session}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 ${session ? 'group-hover:translate-x-full' : ''}`} />
            <span className="relative flex items-center justify-center">
              <span className="mr-2">🚀</span>
              <span className="tracking-wider">スタート / START</span>
            </span>
          </motion.button>

          {!session && (
            <motion.p className="text-sm text-red-300 mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }}>
              Please login with Discord to start.
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <motion.div
          className="text-xs text-gray-400 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          In-Flight Entertainment System • Next Generation Experience
        </motion.div>
      </div>
    </div>
  );
}
