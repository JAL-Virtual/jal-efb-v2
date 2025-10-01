"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useLanguage } from "../../lib/LanguageContext";

/**
 * Dashboard (v2.4 • no pilotId; local-state + SettingsModal storage)
 * - Reads API key from either localStorage 'jalApiKey' (legacy) or 'jal_apiKey' (SettingsModal)
 * - Verifies via /api/auth/verify
 * - Fetches real display name from /api/jal/user (server proxy)
 * - pilotId + ACARS removed; using hoppieId only (from SettingsModal keys)
 */

// Client-only heavy/visual components
const SakuraPetals = dynamic(() => import("../components/SakuraPetals").then(m => m.default), { ssr: false, loading: () => null });
const FloatingCranes = dynamic(() => import("../components/FloatingCranes").then(m => m.default), { ssr: false, loading: () => null });
const SettingsModal = dynamic(() => import("../components/SettingsModal").then(m => m.default), { ssr: false });
const IFuelModal = dynamic(() => import("../components/IFuelModal").then(m => m.default), { ssr: false });
const WeatherModal = dynamic(() => import("../components/WeatherModal").then(m => m.default), { ssr: false });
const LoadsheetModal = dynamic(() => import("../components/LoadsheetModal").then(m => m.default), { ssr: false });
const ASRModal = dynamic(() => import("../components/ASR").then(m => m.default), { ssr: false });
const DelayCodeModal = dynamic(() => import("../components/DelayCodeModal").then(m => m.default), { ssr: false });
const OPTModal = dynamic(() => import("../components/OPT").then(m => m.default), { ssr: false });
const FlighttoolModal = dynamic(() => import("../components/FlightToolsModal").then(m => m.default), { ssr: false });
const MapComponent = dynamic(() => import("../map/MapComponent").then(m => m.default), { ssr: false });
const ClockModal = dynamic(() => import("../components/ClockModal").then(m => m.default), { ssr: false });
const WindCalculatorModal = dynamic(() => import("../components/WindCalculatorModal").then(m => m.default), { ssr: false });

/* -------------------------------------------------------------------------- */
/* Images (local in /public) */
/* -------------------------------------------------------------------------- */
import bg from "../../../public/Images/background.png";
import bgDark from "../../../public/Images/background.png";
import icon_profile from "../../../public/app-icons/profile.png";
import icon_map from "../../../public/app-icons/map.png";
import icon_navigraph from "../../../public/app-icons/navigraph.png";
import icon_opt from "../../../public/app-icons/opt.png";
import icon_weather from "../../../public/app-icons/weather.png";
import icon_fuel from "../../../public/app-icons/ifuel.png";
import icon_asr from "../../../public/app-icons/asr.png";
import icon_delay from "../../../public/app-icons/delay.png";
import icon_loadsheet from "../../../public/app-icons/loadsheet.png";
import icon_plane from "../../../public/app-icons/plane.png";
import icon_home from "../../../public/app-icons/home.png";
import icon_wind from "../../../public/app-icons/wind.png";

/* -------------------------------------------------------------------------- */
/* iPad Align SVG */
/* -------------------------------------------------------------------------- */
function IpadAirAlignIcon({ className = "", strokeWidth = 1.8 }: { className?: string; strokeWidth?: number }) {
  const screen = { x: 16, y: 16, w: 32, h: 36 };
  const v1 = screen.x + screen.w / 3;
  const v2 = screen.x + (2 * screen.w) / 3;
  const h1 = screen.y + screen.h / 3;
  const h2 = screen.y + (2 * screen.h) / 3;
  const cx = screen.x + screen.w / 2;
  const cy = screen.y + screen.h / 2;
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="iPad alignment grid">
      <rect x="10" y="6" width="44" height="52" rx="6" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="32" cy="12" r="1.2" fill="currentColor" />
      <rect x={screen.x} y={screen.y} width={screen.w} height={screen.h} rx="3" stroke="currentColor" strokeWidth={strokeWidth * 0.9} opacity="0.85" />
      <g stroke="currentColor" strokeWidth={strokeWidth * 0.7} strokeLinecap="round" strokeOpacity="0.65">
        <line x1={v1} y1={screen.y} x2={v1} y2={screen.y + screen.h} />
        <line x1={v2} y1={screen.y} x2={v2} y2={screen.y + screen.h} />
        <line x1={screen.x} y1={h1} x2={screen.x + screen.w} y2={h1} />
        <line x1={screen.x} y1={h2} x2={screen.x + screen.w} y2={h2} />
      </g>
      <g stroke="currentColor" strokeWidth={strokeWidth * 0.8} strokeLinecap="round">
        <circle cx={cx} cy={cy} r="3.2" fill="none" opacity="0.8" />
        <line x1={cx} y1={cy - 5.2} x2={cx} y2={cy + 5.2} opacity="0.8" />
        <line x1={cx - 5.2} y1={cy} x2={cx + 5.2} y2={cy} opacity="0.8" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
const ICONS: Record<string, StaticImageData | undefined> = {
  profile: icon_profile,
  map: icon_map,
  navigraph: icon_navigraph,
  opt: icon_opt,
  weather: icon_weather,
  fuel: icon_fuel,
  asr: icon_asr,
  delay: icon_delay,
  loadsheet: icon_loadsheet,
  plane: icon_plane,
  home: icon_home,
  wind: icon_wind,
};

const iconifyFallback: Record<string, string> = {
  flighttools: "mdi:toolbox-outline",
  clock: "mdi:clock-outline",
  notam: "mdi:alert-decagram-outline",
  crew: "mdi:account-group-outline",
};

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

const JAL_RED = "#b60c18";
const DAY_TEXT = "#222222";
const NIGHT_TEXT = "#ffffff";

/** Main button list */
const getButtons = (t: any) => [
  { id: "profile", label: t.buttons.myProfiles, icon: "profile", href: "https://crew.jalvirtual.com/profile", external: true },
  { id: "map", label: t.buttons.map, icon: "map", modal: "map" as const },
  { id: "navigraph", label: t.buttons.navigraph, icon: "navigraph", href: "https://charts.navigraph.com/", external: true },
  { id: "opt", label: t.buttons.opt, icon: "opt", modal: "opt" as const },
  { id: "metar", label: t.buttons.metar, icon: "weather", modal: "metar" as const },
  { id: "ifuel", label: t.buttons.ifuel, icon: "fuel", modal: "fuel" as const },
  { id: "asr", label: t.buttons.asr, icon: "asr", modal: "asr" as const },
  { id: "delay", label: t.buttons.delayCodes, icon: "delay", modal: "delay" as const },
  { id: "loadsheet", label: t.buttons.loadsheet, icon: "loadsheet", modal: "loadsheet" as const },
  { id: "flighttools", label: t.buttons.flightTools, icon: "flighttools", modal: "flighttool" as const },
  { id: "clock", label: t.buttons.clockZulu, icon: "clock", modal: "clock" as const },
  { id: "windcalc", label: t.buttons.windCalc, icon: "wind", modal: "windcalc" as const },
] as const;

export type LoadsheetFields = {
  date?: string;
  costIndex?: string;
  zfw?: string;
  zfwMax?: string;
  tow?: string;
  towMax?: string;
  pax?: string;
  route?: string;
};

type ModalKey =
  | "settings"
  | "fuel"
  | "metar"
  | "loadsheet"
  | "asr"
  | "delay"
  | "opt"
  | "flighttool"
  | "map"
  | "clock"
  | "windcalc"
  | null;

// Isomorphic layout effect
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : () => {};

// Determine preferred theme synchronously
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = (localStorage.getItem("theme") as "light" | "dark" | null) ?? null;
  if (stored) return stored;
  const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

// util: mask API key
function maskKey(v: string) {
  const s = (v || "").trim();
  if (!s) return "";
  if (s.length <= 8) return "••••";
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

// robust pickers for phpVMS payload shapes
function pickName(payload: any): string | undefined {
  return (
    payload?.data?.name ||
    payload?.data?.user?.name ||
    payload?.user?.name ||
    payload?.name ||
    payload?.pilot?.name ||
    undefined
  );
}
function pickPilotId(payload: any): string | undefined {
  return (
    payload?.data?.pilot_id ||
    payload?.data?.user?.pilot_id ||
    payload?.pilot_id ||
    payload?.pilotid ||
    payload?.id ||
    undefined
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();

  // --- Mount + theme -------------------------------------------------------
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => getInitialTheme());
  const isDark = theme === "dark";

  useIsoLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isDark]);

  useEffect(() => setMounted(true), []);

  // --- API Key auth (localStorage -> verify + fetch /api/jal/user) ---------
  const [apiKey, setApiKey] = useState<string>("");
  const [user, setUser] = useState<{ jalId?: string; name?: string } | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  // Settings managed locally (and also saved by SettingsModal):
  const [hoppieId, setHoppieId] = useState<string>("");
  const [simbriefId, setSimbriefId] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Prefer legacy key first for backward compatibility, then SettingsModal key
        const legacyKey = typeof window !== "undefined" ? localStorage.getItem("jalApiKey") : null;
        const modalKey = typeof window !== "undefined" ? localStorage.getItem("jal_apiKey") : null;
        const stored = legacyKey || modalKey;

        // Pull user flight-related settings saved by SettingsModal
        const savedHop = typeof window !== "undefined" ? localStorage.getItem("jal_hoppieId") : null;
        const savedSim = typeof window !== "undefined" ? localStorage.getItem("jal_simbriefId") : null;
        setHoppieId(savedHop || "");
        setSimbriefId(savedSim || "");

        if (!stored) {
          router.replace("/");
          return;
        }

        // Ensure legacy key is set so existing auth flow keeps working
        try { localStorage.setItem("jalApiKey", stored); } catch {}
        setApiKey(stored);

        // 1) verify via internal route
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: stored }),
          cache: "no-store",
        });
        const verifyData = await res.json();
        if (!alive) return;

        if (!res.ok) {
          toast.error("Invalid or expired API Key. Please sign in again.");
          router.replace("/");
          return;
        }

        const provisional: { jalId?: string; name?: string } = {
          jalId: verifyData?.user?.pilot_id || verifyData?.user?.pilotid || verifyData?.user?.id,
          name: verifyData?.user?.name || verifyData?.user?.fname,
        };

        // 2) fetch from proxy (data.name guaranteed; no CORS)
        try {
          const ures = await fetch("/api/jal/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: stored }),
            cache: "no-store",
          });

          if (ures.ok) {
            const { data: payload } = await ures.json();
            const name = pickName(payload);
            const pid = pickPilotId(payload);
            setUser({ jalId: pid ?? provisional.jalId, name: name ?? provisional.name });
          } else {
            setUser(provisional);
          }
        } catch {
          setUser(provisional);
        }
      } catch {
        router.replace("/");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const handleLogout = useCallback(async () => {
    setAuthBusy(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("jalApiKey");
        // also clear the SettingsModal variant to be safe on sign out
        localStorage.removeItem("jal_apiKey");
      }
    } catch {}
    toast("Signed out", { icon: "👋" });
    router.replace("/");
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 80);
    }
    setAuthBusy(false);
  }, [router]);

  // --- UTC clock -----------------------------------------------------------
  const [utcTime, setUtcTime] = useState<string>(() => {
    if (typeof window === "undefined") return "--:--";
    return new Date().toISOString().substr(11, 5);
  });

  const [flight, setFlight] = useState({ dpt: "-", arr: "-" });

  const [loadsheetData, setLoadsheetData] = useState<Partial<LoadsheetFields>>({});
  const [countdown, setCountdown] = useState("");

  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);



  // Close popup with Esc key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, []);

  // Animations (memo)
  const buttonTransition: Transition = useMemo(() => ({ delay: 0.03, type: "spring", stiffness: 300, damping: 15 }), []);
  const gridAnim = useMemo(() => ({ hidden: { opacity: 0, scale: 0.98, y: 24 }, show: { opacity: 1, scale: 1, y: 0, transition: { stiffness: 120, damping: 16 } } }), []);
  const modalAnim = useMemo(
    () => ({
      hidden: { opacity: 0, y: 32, scale: 0.98 },
      show: { opacity: 1, y: 0, scale: 1, transition: { stiffness: 170, damping: 20 } },
      exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.22 } },
    }),
    []
  );

  // ====== NO localStorage for IDs here; SettingsModal owns persistence ======
  // Load hoppieId/simbriefId once at mount (mirrors SettingsModal keys)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedHop = localStorage.getItem("jal_hoppieId") || "";
      const savedSim = localStorage.getItem("jal_simbriefId") || "";
      setHoppieId(savedHop);
      setSimbriefId(savedSim);
    } catch {}
  }, []);

  // Visibility-aware interval helper
  const usePageInterval = (fn: () => void, ms: number) => {
    const fnRef = useRef(fn);
    useEffect(() => {
      fnRef.current = fn;
    }, [fn]);
    useEffect(() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      let cancelled = false;
      const tick = () => {
        if (cancelled) return;
        if (typeof document !== "undefined" && document.visibilityState === "visible") fnRef.current();
        timer = setTimeout(tick, ms);
      };
      timer = setTimeout(tick, ms);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }, [ms]);
  };

  // UTC clock tick
  usePageInterval(() => {
    setUtcTime(new Date().toISOString().substr(11, 5));
  }, 60_000);

  // SimBrief fetch
  async function fetchSimbrief(id: string) {
    try {
      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`, { cache: "no-store" });
      if (!res.ok) throw new Error("SimBrief HTTP error");
      return await res.json();
    } catch {
      return {} as any;
    }
  }

  // Update flight & loadsheet (driven by simbriefId only)
  useEffect(() => {
    let ignore = false;
    if (!simbriefId) {
      setFlight({ dpt: "-", arr: "-" });
      setLoadsheetData({});
      return;
    }
    (async () => {
      const data = await fetchSimbrief(simbriefId);
      if (ignore || !data) return;
      try {
        setFlight({ dpt: data.origin?.icao_code || data.origin || "-", arr: data.destination?.icao_code || data.destination || "-" });
        setLoadsheetData({
          date: data.date_dep_utc || data.date,
          costIndex: data.cost_index,
          zfw: data.zfw,
          zfwMax: data.zfw_max,
          tow: data.takeoff_weight || data.tow,
          towMax: data.takeoff_max_weight || data.tow_max,
          pax: data.pax_total || data.pax_count,
          route: data.route,
        });
      } catch {
        setFlight({ dpt: "-", arr: "-" });
        setLoadsheetData({});
      }
    })();
    return () => {
      ignore = true;
    };
  }, [simbriefId]);

  // Departure countdown
  usePageInterval(() => {
    if (!loadsheetData.date) return;
    const dep = new Date(loadsheetData.date);
    if (isNaN(dep.getTime())) {
      setCountdown("–");
      return;
    }
    const now = new Date();
    const diff = dep.getTime() - now.getTime();
    if (diff <= 0) setCountdown("✈️ Departed");
    else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${h}h ${m}m to dep.`);
    }
  }, 60_000);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch {}
      toast(`Switched to ${next} mode`, {
        icon: next === "dark" ? "🌙" : "☀️",
        style: {
          background: next === "dark" ? "#111827" : "#ffffff",
          color: next === "dark" ? NIGHT_TEXT : DAY_TEXT,
          border: `1px solid ${next === "dark" ? "#1f2937" : "#e5e7eb"}`,
          boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)",
        },
      });
      return next;
    });
  }, []);

  // Save settings (from SettingsModal)
  const handleSaveSettings = useCallback(
    (api: string, hop: string, sim: string) => {
      setApiKey(api);
      setHoppieId(hop);
      setSimbriefId(sim);
      // Ensure verify still reads the expected key name
      try { localStorage.setItem("jalApiKey", api); } catch {}
      toast.success("Settings Saved!", {
        icon: "✅",
        style: {
          background: isDark ? "#111827" : "#ffffff",
          color: isDark ? NIGHT_TEXT : DAY_TEXT,
          border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
          boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)",
        },
      });
    },
    [isDark]
  );

  // Icon component (memoized with fallback)
  const CustomIcon = useMemo(
    () =>
      React.memo(function CustomIconInner({ iconName, className = "" }: { iconName: string; className?: string }) {
        if (iconName === "ipadAlign" || iconName === "ipad_align" || iconName === "ipad-air-align") {
          return <IpadAirAlignIcon className={`${className} w-7 h-7 sm:w-8 sm:h-8 text-gray-700 dark:text-gray-200`} />;
        }
        const src = ICONS[iconName];
        if (!src) {
          const icon = iconifyFallback[iconName] ?? "mdi:image-off-outline";
          return <Icon icon={icon} className={`${className} w-7 h-7 opacity-80`} />;
        }
        return <Image src={src} alt={iconName} width={32} height={32} className={`${className} object-contain`} priority={false} />;
      }),
    []
  );

  // Unified button/tile
  const ButtonTile = useMemo(
    () =>
      React.memo(function ButtonTileInner({ children, onClick, href, external, id, label }: { children: React.ReactNode; onClick?: () => void; href?: string; external?: boolean; id: string; label?: string }) {
        const base =
          "relative w-full flex flex-col items-center justify-center select-none";
        const iconWrap = isDark
          ? "bg-white/10 hover:bg-white/20"
          : "bg-white/80 hover:bg-white";
        const labelColor = isDark ? "text-white/90" : "text-gray-900";

        const body = (
          <div className={`${base}`}>
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${iconWrap} backdrop-blur shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/20 flex items-center justify-center transition-colors`}>
              {children}
            </div>
            <span className={`mt-2 text-[12px] sm:text-[13px] font-medium text-center ${labelColor}`}>{label}</span>
          </div>
        );

        const commonProps = {
          className: "block",
          rel: external ? "noopener noreferrer" : undefined,
          target: external ? "_blank" : undefined,
        } as const;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            data-tile-id={id}
            className="justify-self-center"
          >
            {href ? (
              <Link href={href} {...commonProps}>
                {body}
              </Link>
            ) : (
              <button type="button" onClick={onClick} className="focus:outline-none" aria-label="Open module">
                {body}
              </button>
            )}
          </motion.div>
        );
      }),
    [buttonTransition, isDark]
  );

  const openModal = (k: ModalKey) => setActiveModal(k);

  // derive display name (prefer data.name from proxy)
  const userDisplay = useMemo(() => {
    if (user?.name) return user.name;        // ✅ prefer real display name
    if (user?.jalId) return String(user.jalId);
    if (apiKey) return maskKey(apiKey);      // fallback
    return "Pilot";
  }, [user, apiKey]);

  return (
    <div className={`${poppins.className} relative w-full min-h-screen overflow-x-hidden transition-all duration-500 ${isDark ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900"}`}>
      {/* Enhanced Background */}
      <div className="fixed inset-0 z-0 transition-opacity duration-700">
        <Image src={isDark ? bgDark : bg} alt="JAL Background" fill sizes="100vw" style={{ objectFit: "cover" }} priority className="opacity-15 dark:opacity-8" />
        {/* Beautiful gradient overlays */}
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute -top-32 -left-32 w-[50rem] h-[50rem] rounded-full blur-3xl animate-pulse-slow ${isDark ? "bg-gradient-to-r from-red-500/20 via-pink-500/15 to-purple-500/20" : "bg-gradient-to-r from-blue-400/25 via-indigo-400/20 to-purple-400/25"}`} />
          <div className={`absolute top-1/2 -right-32 w-[45rem] h-[45rem] rounded-full blur-3xl animate-pulse-slower ${isDark ? "bg-gradient-to-l from-amber-500/15 via-orange-500/10 to-red-500/15" : "bg-gradient-to-l from-emerald-400/20 via-teal-400/15 to-blue-400/20"}`} />
          <div className={`absolute -bottom-24 left-1/3 w-[35rem] h-[35rem] rounded-full blur-3xl animate-pulse-slow ${isDark ? "bg-gradient-to-t from-purple-500/10 via-pink-500/8 to-red-500/10" : "bg-gradient-to-t from-violet-400/15 via-purple-400/10 to-indigo-400/15"}`} />
        </div>
        {/* Subtle grid pattern */}
        <div className={`absolute inset-0 opacity-5 dark:opacity-3 ${isDark ? "bg-gradient-to-r from-white/10 0%, transparent 50%, from-white/10 100%" : "bg-gradient-to-r from-gray-900/10 0%, transparent 50%, from-gray-900/10 100%"}`} style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Toaster */}
      {mounted && (
        <Toaster position="top-center" toastOptions={{ className: "jal-toast", duration: 2600, style: { fontSize: "1.05em", padding: "0.9em 1.2em", boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" } }} />
      )}

      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {mounted && <SakuraPetals />}
        {mounted && <FloatingCranes />}
      </div>

      {/* Main */}
      <main className="relative z-10 w-full px-0 sm:px-0 pt-6 pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative backdrop-blur-xl rounded-3xl p-6 mb-8 border ${isDark ? "bg-white/5 border-white/10 shadow-2xl" : "bg-white/40 border-white/20 shadow-xl"} transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              {/* Left side - Time and Status */}
              <div className="flex items-center gap-6">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-white/40"} backdrop-blur-sm`}>
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:clock-outline" className="text-lg" />
                    <span className="text-sm font-medium">UTC</span>
                  </div>
                  <time suppressHydrationWarning className="text-lg font-bold font-mono">{utcTime}</time>
                </div>
                
                {/* Status indicators */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-green-500/20 border border-green-500/30" : "bg-green-100/80 border border-green-200/60"} backdrop-blur-sm`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Online</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? "bg-blue-500/20 border border-blue-500/30" : "bg-blue-100/80 border border-blue-200/60"} backdrop-blur-sm`}>
                    <Icon icon="mdi:wifi" className="text-sm" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                </div>
              </div>

              {/* Right side - User info and controls */}
              <div className="flex items-center gap-4">
                {/* User welcome */}
                <div className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-white/40"} backdrop-blur-sm`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                    <Icon icon="mdi:account" className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{`${t.dashboard.welcomeBack}`}</p>
                    <p className="text-xs opacity-70">{userDisplay}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Link 
                    href="/dashboard" 
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-200 hover:scale-105 ${isDark ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-white/60 border-white/40 hover:bg-white/80"} backdrop-blur-sm`} 
                    aria-label="Home"
                  >
                    <Icon icon="mdi:home-outline" className="text-lg" />
                  </Link>
                  <button 
                    onClick={() => setActiveModal("settings")} 
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-200 hover:scale-105 ${isDark ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-white/60 border-white/40 hover:bg-white/80"} backdrop-blur-sm`} 
                    aria-label="Settings"
                  >
                    <Icon icon="mdi:cog" className="text-lg" />
                  </button>
                  <button 
                    onClick={handleLogout} 
                    disabled={authBusy}
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border transition-all duration-200 hover:scale-105 disabled:opacity-50 ${isDark ? "bg-red-500/20 border-red-500/30 hover:bg-red-500/30" : "bg-red-100/80 border-red-200/60 hover:bg-red-200/80"} backdrop-blur-sm`}
                    aria-label="Logout"
                  >
                    <Icon icon="mdi:logout" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>


          {/* Enhanced Button Grid */}
          <motion.div 
            variants={gridAnim} 
            initial="hidden" 
            animate="show" 
            className="grid w-full gap-6 sm:gap-8 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))] max-w-6xl mx-auto"
          >
            {getButtons(t).map((b, index) => {
              const commonInner = (
                <>
                  <CustomIcon iconName={b.icon} className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-200 group-hover:scale-110" />
                </>
              );
              
              const buttonContent = (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.05, 
                    duration: 0.4, 
                    ease: "easeOut" 
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative w-full h-32 sm:h-36 flex flex-col items-center justify-center rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isDark 
                      ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-red-500/10" 
                      : "bg-white/60 border-white/40 hover:bg-white/80 hover:border-white/60 hover:shadow-xl hover:shadow-red-500/5"
                  } backdrop-blur-xl`}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-red-500/10 group-hover:via-pink-500/5 group-hover:to-purple-500/10 transition-all duration-300 rounded-3xl" />
                  
                  {/* Icon container */}
                  <div className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-300 ${
                    isDark 
                      ? "bg-white/10 group-hover:bg-white/20" 
                      : "bg-white/80 group-hover:bg-white"
                  } backdrop-blur-sm shadow-lg group-hover:shadow-xl`}>
                    {commonInner}
                  </div>
                  
                  {/* Label */}
                  <span className={`relative z-10 mt-3 text-sm sm:text-base font-semibold text-center transition-colors duration-300 ${
                    isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-gray-900"
                  }`}>
                    {b.label}
                  </span>
                  
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-purple-500/5 blur-xl" />
                </motion.div>
              );

              if ("modal" in b && (b as any).modal) {
                return (
                  <button 
                    key={b.id} 
                    type="button"
                    onClick={() => setActiveModal((b as any).modal as ModalKey)}
                    className="focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-3xl"
                  >
                    {buttonContent}
                  </button>
                );
              }
              
              if ((b as any).href) {
                return (
                  <Link 
                    key={b.id} 
                    href={(b as any).href} 
                    target={(b as any).external ? "_blank" : undefined}
                    rel={(b as any).external ? "noopener noreferrer" : undefined}
                    className="focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-3xl"
                  >
                    {buttonContent}
                  </Link>
                );
              }
              
              return (
                <div key={b.id}>
                  {buttonContent}
                </div>
              );
            })}
          </motion.div>

          {/* Enhanced Bottom Dock */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
            className={`pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-8 w-[90%] max-w-[800px] rounded-3xl backdrop-blur-xl border shadow-2xl px-6 py-4 flex items-center justify-center gap-6 ${
              isDark 
                ? "bg-white/5 border-white/10 shadow-red-500/5" 
                : "bg-white/60 border-white/40 shadow-red-500/10"
            }`}
          >
            {[
              { id: "home", icon: "mdi:home-outline", href: "/dashboard", label: "Home" },
              { id: "navigraph", icon: "mdi:chart-areaspline", href: "https://charts.navigraph.com/", external: true, label: "Charts" },
              { id: "settings", icon: "mdi:cog", label: "Settings" },
            ].map((d, index) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                {d.href ? (
                  <Link 
                    href={d.href as string} 
                    target={d.external ? "_blank" : undefined} 
                    rel={d.external ? "noopener noreferrer" : undefined} 
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 hover:shadow-lg ${
                      isDark 
                        ? "bg-white/10 hover:bg-white/20 hover:shadow-red-500/20" 
                        : "bg-white/80 hover:bg-white hover:shadow-red-500/10"
                    } backdrop-blur-sm border border-white/20`}
                  >
                    <Icon icon={d.icon} className="text-lg" />
                  </Link>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setActiveModal("settings")} 
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 hover:shadow-lg ${
                      isDark 
                        ? "bg-white/10 hover:bg-white/20 hover:shadow-red-500/20" 
                        : "bg-white/80 hover:bg-white hover:shadow-red-500/10"
                    } backdrop-blur-sm border border-white/20`}
                  >
                    <Icon icon={d.icon} className="text-lg" />
                  </button>
                )}
                <span className={`text-xs font-medium transition-colors ${
                  isDark ? "text-white/70" : "text-gray-600"
                }`}>
                  {d.label}
                </span>
              </motion.div>
            ))}
          </motion.div>


          {/* Enhanced Loadsheet Summary */}
          {loadsheetData.costIndex && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
              className={`w-full max-w-5xl mx-auto mt-12 backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden ${
                isDark 
                  ? "bg-white/5 border-white/10 shadow-red-500/5" 
                  : "bg-white/60 border-white/40 shadow-red-500/10"
              }`}
              aria-labelledby="loadsheet-heading"
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b ${isDark ? "border-white/10" : "border-white/20"}`}>
                <div className="flex items-center justify-between">
                  <h3 id="loadsheet-heading" className="text-lg sm:text-xl font-bold flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      isDark ? "bg-red-500/20" : "bg-red-100/80"
                    }`}>
                      <Icon icon="mdi:clipboard-text" className={`text-lg ${isDark ? "text-red-400" : "text-red-600"}`} />
                    </div>
                    <span className={isDark ? "text-white" : "text-gray-900"}>Flight Loadsheet</span>
                  </h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    isDark ? "bg-white/10 border border-white/20" : "bg-white/80 border border-white/40"
                  }`}>
                    <Icon icon="mdi:airplane" className="text-sm" />
                    <span className="text-xs font-medium">{simbriefId}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <EnhancedSummaryCell 
                    title="Departure UTC" 
                    value={loadsheetData.date ? new Date(loadsheetData.date).toISOString().substr(11, 5) : "-"} 
                    icon="mdi:clock-outline"
                    theme={isDark ? "dark" : "light"} 
                  />
                  <EnhancedSummaryCell 
                    title="Countdown" 
                    value={countdown} 
                    icon="mdi:timer-outline"
                    theme={isDark ? "dark" : "light"} 
                  />
                  <EnhancedSummaryCell 
                    title="Cost Index" 
                    value={loadsheetData.costIndex} 
                    icon="mdi:chart-line"
                    theme={isDark ? "dark" : "light"} 
                  />
                  <EnhancedSummaryCell 
                    title="Passengers" 
                    value={loadsheetData.pax} 
                    icon="mdi:account-group"
                    theme={isDark ? "dark" : "light"} 
                  />
                  <EnhancedSummaryCell 
                    title="Zero Fuel Weight" 
                    value={`${loadsheetData.zfw} / ${loadsheetData.zfwMax} kg`} 
                    icon="mdi:weight-kilogram"
                    theme={isDark ? "dark" : "light"} 
                  />
                  <EnhancedSummaryCell 
                    title="Takeoff Weight" 
                    value={`${loadsheetData.tow} / ${loadsheetData.towMax} kg`} 
                    icon="mdi:airplane-takeoff"
                    theme={isDark ? "dark" : "light"} 
                  />
                </div>
                
                {/* Route Section */}
                <div className={`mt-6 p-4 rounded-2xl border transition-all duration-300 ${
                  isDark 
                    ? "bg-white/5 border-white/10 hover:bg-white/10" 
                    : "bg-white/40 border-white/30 hover:bg-white/60"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="mdi:map-marker-path" className={`text-lg ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                    <h4 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Flight Route</h4>
                  </div>
                  <div className={`font-mono text-sm p-3 rounded-xl ${
                    isDark ? "bg-black/20 border border-white/10" : "bg-white/60 border border-white/40"
                  }`}>
                    <p className="break-all" aria-label="Flight route">
                      {loadsheetData.route || "No route data available"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </main>

      {/* Popups */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setActiveModal(null)}
              aria-hidden
            />
            <motion.div key="popup" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className={`${isDark ? "bg-gray-900/90 text-white border-white/10" : "bg-white/95 text-gray-900 border-black/10"} rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto relative`} onClick={(e) => e.stopPropagation()}>
                {activeModal === "settings" && (
                  <SettingsModal
                    show
                    onClose={() => setActiveModal(null)}
                    onSave={handleSaveSettings}
                    initialApiKey={apiKey}
                    initialHoppieId={hoppieId}
                    initialSimbriefId={simbriefId}
                  />
                )}
                {activeModal === "fuel" && (
                  <IFuelModal
                    show
                    onClose={() => setActiveModal(null)}
                    dpt={flight.dpt}
                    arr={flight.arr}
                    simbriefId={simbriefId}
                    onConfirm={async () => {
                      toast.success("Fuel Request Sent!", {
                        icon: "⛽",
                        style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                      });
                      return "Fuel Request Sent!";
                    }}
                  />
                )}
                {activeModal === "metar" && <WeatherModal show onClose={() => setActiveModal(null)} />}
                {activeModal === "loadsheet" && (
                  <LoadsheetModal
                    show
                    onClose={() => setActiveModal(null)}
                    onAutofill={async (id: string) => {
                      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`, { cache: "no-store" });
                      return res.json();
                    }}
                    hoppieId={hoppieId}
                    simbriefId={simbriefId}
                    onSubmit={async () => {
                      toast.success("Loadsheet Sent!", {
                        icon: "📦",
                        style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                      });
                      return "Loadsheet Sent!";
                    }}
                  />
                )}
                {activeModal === "asr" && <ASRModal show onClose={() => setActiveModal(null)} />}
                {activeModal === "delay" && <DelayCodeModal show onClose={() => setActiveModal(null)} />}
                {activeModal === "opt" && (
                  <OPTModal
                    show
                    onClose={() => setActiveModal(null)}
                    onAutofill={async (id: string) => {
                      const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`, { cache: "no-store" });
                      return res.json();
                    }}
                    hoppieId={hoppieId}
                    simbriefId={simbriefId}
                    onSubmit={async () => {
                      toast.success("OPT Sent!", {
                        icon: "📈",
                        style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                      });
                      return "OPT Sent!";
                    }}
                  />
                )}
                {activeModal === "flighttool" && <FlighttoolModal show onClose={() => setActiveModal(null)} simbriefId={simbriefId} />}
                {activeModal === "map" && (
                  <div className="p-2">
                    <MapComponent embedded onClose={() => setActiveModal(null)} />
                  </div>
                )}
                {activeModal === "clock" && <ClockModal show onClose={() => setActiveModal(null)} />}
                {activeModal === "windcalc" && (
                  <WindCalculatorModal
                    show
                    onClose={() => setActiveModal(null)}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style jsx global>{`
        html, body, #__next { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
        @keyframes gradient-shift { 
          0% { background-position: 0% 50%; } 
          100% { background-position: 100% 50%; } 
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.4; }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.35; }
        }
        .jal-title-shine {
          background: linear-gradient(90deg, ${JAL_RED} 0%, #ea4256 50%, ${JAL_RED} 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 4s ease-in-out infinite alternate;
          text-shadow: 0 4px 30px rgba(255, 0, 72, 0.15);
        }
        .jal-toast { backdrop-filter: blur(12px); }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 12s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        :focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(244, 63, 94, .6); border-radius: 0.75rem; }
      `}</style>
    </div>
  );
}

function SummaryCell({ title, value, theme }: { title: string; value?: React.ReactNode; theme: "light" | "dark" }) {
  const isDark = theme === "dark";
  return (
    <motion.div
      className={`${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} p-3 rounded-lg transition-colors`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <p className={`${isDark ? "text-gray-300" : "text-gray-600"} text-xs font-medium mb-1`}>{title}</p>
      <p className="font-medium">{value}</p>
    </motion.div>
  );
}

function EnhancedSummaryCell({ title, value, icon, theme }: { title: string; value?: React.ReactNode; icon: string; theme: "light" | "dark" }) {
  const isDark = theme === "dark";
  return (
    <motion.div
      className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-red-500/10" 
          : "bg-white/40 border-white/30 hover:bg-white/60 hover:border-white/50 hover:shadow-red-500/5"
      } backdrop-blur-sm`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
          isDark ? "bg-red-500/20" : "bg-red-100/80"
        }`}>
          <Icon icon={icon} className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`} />
        </div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${
          isDark ? "text-gray-300" : "text-gray-600"
        }`}>
          {title}
        </p>
      </div>
      <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
        {value || "-"}
      </p>
    </motion.div>
  );
}
