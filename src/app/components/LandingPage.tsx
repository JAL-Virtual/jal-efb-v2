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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const isDark = theme === "dark";

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
    <div className={`relative w-full h-screen overflow-hidden transition-all duration-500 ${
      isDark ? "bg-black text-white" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900"
    }`}>
      <Image
        src="/Images/ife-galaxy.jpg"
        alt="IFE Background"
        fill
        priority
        style={{ objectFit: "cover" }}
        className={`pointer-events-none select-none transition-opacity duration-500 ${
          isDark ? "opacity-60" : "opacity-30"
        }`}
      />

      <div className={`absolute inset-0 z-0 transition-all duration-500 ${
        isDark 
          ? "bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-black/80" 
          : "bg-gradient-to-br from-blue-100/40 via-purple-100/40 to-indigo-100/60"
      }`} />

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
        {/* Enhanced Header */}
        <div className="w-full flex justify-between items-start">
          <div className={`backdrop-blur-xl rounded-2xl p-4 border ${
            isDark 
              ? "bg-white/5 border-white/10 shadow-2xl" 
              : "bg-white/40 border-white/20 shadow-xl"
          }`}>
            <div className={`text-2xl font-bold font-mono ${
              isDark ? "text-white" : "text-gray-900"
            }`}>
              <time suppressHydrationWarning>{formattedTime}</time>
            </div>
            <div className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}>
              Local Time
            </div>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={() => {
              const newTheme = isDark ? "light" : "dark";
              setTheme(newTheme);
              localStorage.setItem("theme", newTheme);
            }}
            className={`backdrop-blur-xl rounded-2xl p-3 border transition-all duration-200 hover:scale-105 ${
              isDark 
                ? "bg-white/5 border-white/10 hover:bg-white/10" 
                : "bg-white/40 border-white/20 hover:bg-white/60"
            }`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Enhanced Main Content */}
        <div className="flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`text-5xl md:text-6xl font-light tracking-wider mb-8 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            WELCOME ABOARD
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`backdrop-blur-xl rounded-3xl p-8 border shadow-2xl ${
              isDark 
                ? "bg-white/5 border-white/10" 
                : "bg-white/40 border-white/20"
            }`}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-4xl md:text-5xl font-bold flex items-center gap-4"
            >
              <span className={`${isDark ? "text-white" : "text-gray-900"}`}>
                {safeFlight.dpt}
              </span>
              <span className={`text-3xl ${isDark ? "text-red-400" : "text-red-600"}`}>
                →
              </span>
              <span className={`${isDark ? "text-white" : "text-gray-900"}`}>
                {safeFlight.arr}
              </span>
            </motion.h2>
            
            {safeFlight.flightNumber && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`text-lg font-medium mt-4 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Flight {safeFlight.flightNumber}
              </motion.p>
            )}
          </motion.div>

          <motion.button
            type="button"
            onClick={() => setShowLogin(true)}
            className={`mt-12 px-12 py-5 rounded-3xl font-bold text-lg transition-all duration-300 flex items-center gap-3 focus:outline-none focus:ring-4 ${
              isDark 
                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 focus:ring-red-500/50 shadow-2xl shadow-red-500/25" 
                : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 focus:ring-red-500/50 shadow-2xl shadow-red-500/25"
            } backdrop-blur-xl border border-white/20 hover:scale-105 hover:shadow-3xl`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
          >
            <span className="text-2xl">🚀</span>
            <span>スタート / START</span>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={`text-sm font-medium mt-8 backdrop-blur-xl rounded-2xl px-6 py-3 border ${
            isDark 
              ? "bg-white/5 border-white/10 text-gray-300" 
              : "bg-white/40 border-white/20 text-gray-600"
          }`}
        >
          ✈️ In-Flight Entertainment System • Next Generation
        </motion.div>
      </div>

      <AnimatePresence>
        {showLogin && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowLogin(false)}
            />
            
            {/* Modal */}
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="apiKeyTitle"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl border shadow-2xl rounded-3xl overflow-hidden ${
                isDark 
                  ? "bg-white/5 border-white/10" 
                  : "bg-white/60 border-white/20"
              }`}
            >
              <div className="p-6">
                <h3 id="apiKeyTitle" className={`text-xl font-bold mb-6 flex items-center gap-3 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isDark ? "bg-blue-500/20" : "bg-blue-100/80"
                  }`}>
                    <span className="text-lg">🔑</span>
                  </div>
                  Enter API Key
                </h3>

                <div className="relative mb-4">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your phpVMS API key"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyKey()}
                    className={`w-full px-4 py-3 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 tracking-widest pr-12 ${
                      isDark 
                        ? "bg-white/10 border-white/20 focus:ring-blue-500/50 text-white placeholder-gray-400" 
                        : "bg-white/80 border-white/40 focus:ring-blue-500/50 text-gray-900 placeholder-gray-500"
                    } backdrop-blur-sm`}
                    aria-describedby="apiKeyHelp"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium transition-colors ${
                      isDark 
                        ? "text-gray-300 hover:text-white" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    aria-label={showKey ? "Hide API key" : "Show API key"}
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                
                <p id="apiKeyHelp" className={`text-sm mb-4 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}>
                  Your key is validated via a server route using <code className={`px-2 py-1 rounded ${
                    isDark ? "bg-white/10 text-blue-300" : "bg-white/60 text-blue-600"
                  }`}>X-API-Key</code>.
                </p>

                {error && (
                  <div className={`mb-4 p-3 rounded-2xl border ${
                    isDark 
                      ? "bg-red-500/10 border-red-500/20 text-red-300" 
                      : "bg-red-100/80 border-red-200/60 text-red-600"
                  }`} role="alert">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowLogin(false)}
                    className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover:scale-105 ${
                      isDark 
                        ? "bg-white/10 border border-white/20 hover:bg-white/20 text-white" 
                        : "bg-white/60 border border-white/40 hover:bg-white/80 text-gray-900"
                    } backdrop-blur-sm`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyKey}
                    disabled={loading}
                    className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center gap-2 ${
                      isDark 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25" 
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25"
                    } backdrop-blur-sm`}
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
