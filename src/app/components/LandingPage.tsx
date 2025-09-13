"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Star = { top: number; left: number; size: number; dur: number; delay: number };

export type FlightInfo = {
  dpt?: string;
  arr?: string;
  flightNumber?: string;
};

export type LandingPageProps = {
  onEnter: (apiKey: string) => void;
  flight?: FlightInfo;
};

export default function LandingPage({ onEnter, flight }: LandingPageProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const formattedTime = useMemo(
    () => (currentTime ? currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"),
    [currentTime]
  );

  const [showLogin, setShowLogin] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jalApiKey");
    if (saved) setApiKey(saved);
  }, []);

  const safeFlight = flight || { dpt: "NOW", arr: "HERE", flightNumber: "IFE-2025" };

  const stars: Star[] = useMemo(
    () =>
      Array.from({ length: 40 }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        dur: Math.random() * 3 + 2,
        delay: Math.random() * 5,
      })),
    []
  );

  const handleVerifyKey = async () => {
    setLoading(true);
    setError("");
    try {
      if (!apiKey || apiKey.trim().length < 8) {
        throw new Error("Paste your phpVMS API key from crew.jalvirtual.com (Profile → API Key).");
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Verification failed");

      localStorage.setItem("jalApiKey", apiKey.trim());
      setShowLogin(false);
      onEnter(apiKey.trim());
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <Image
        src="/Images/ife-galaxy.jpg"
        alt="IFE Background"
        fill
        priority
        style={{ objectFit: "cover" }}
        className="pointer-events-none select-none opacity-60"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-black/80 z-0" />

      <div className="absolute inset-0 z-0 overflow-hidden">
        {stars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 px-6 text-center">
        <div className="w-full flex justify-between">
          <div>
            <div className="text-2xl font-light">
              <time suppressHydrationWarning>{formattedTime}</time>
            </div>
            <div className="text-sm text-gray-300">Local Time</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-5xl font-light tracking-wider mb-6"
          >
            WELCOME ABOARD
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-5xl font-bold"
          >
            {safeFlight.dpt} <span className="text-blue-300 mx-2">→</span> {safeFlight.arr}
          </motion.h2>

          <motion.button
            type="button"
            onClick={() => setShowLogin(true)}
            className="mt-10 px-10 py-4 rounded-full font-semibold bg-gradient-to-b from-blue-600 to-blue-800 hover:scale-105 hover:shadow-lg transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            whileTap={{ scale: 0.95 }}
          >
            🚀 スタート / START
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-gray-400 mt-8"
        >
          In-Flight Entertainment System • Next Generation
        </motion.div>
      </div>

      <AnimatePresence>
        {showLogin && (
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="apiKeyTitle"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700"
          >
            <h3 id="apiKeyTitle" className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="text-blue-400">🔑</span> Enter API Key
            </h3>

            <div className="relative mb-3">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your phpVMS API key"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerifyKey()}
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white tracking-widest pr-12"
                aria-describedby="apiKeyHelp"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 hover:text-white"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p id="apiKeyHelp" className="text-xs text-gray-400 mb-2">
              Your key is validated via a server route using <code>X-API-Key</code>.
            </p>

            {error && <p className="text-red-400 text-sm mb-2" role="alert">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogin(false)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyKey}
                disabled={loading}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 0 1 8-8v2a6 6 0 0 0-6 6H4z" />
                  </svg>
                )}
                {loading ? "Verifying..." : "Login"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
