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

/**
 * Dashboard (v2.3 • API-key auth + welcome name via proxy /api/jal/user)
 * - Reads `jalApiKey` from localStorage
 * - Verifies via /api/auth/verify
 * - Fetches real display name from /api/jal/user (server proxy) → uses data.name
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
const ClockModal = dynamic(() => import("../components/ClockModal").then(m => m.default), { ssr: false });
const NotamModal = dynamic(() => import("../components/NotamsModal").then(m => m.default), { ssr: false });
const CrewCenterModal = dynamic(() => import("../components/CrewcenterModal").then(m => m.default), { ssr: false });

/* -------------------------------------------------------------------------- */
/* Images (local in /public — ไม่ต้องตั้ง remotePatterns) */
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
const BUTTONS = [
  { id: "profile", label: "My Profiles", icon: "profile", href: "https://crew.jalvirtual.com/profile", external: true },
  { id: "map", label: "Map", icon: "map", href: "/map" },
  { id: "navigraph", label: "Navigraph", icon: "navigraph", href: "https://charts.navigraph.com/", external: true },
  { id: "opt", label: "OPT", icon: "opt", modal: "opt" as const },
  { id: "metar", label: "Metar", icon: "weather", modal: "metar" as const },
  { id: "ifuel", label: "iFuel", icon: "fuel", modal: "fuel" as const },
  { id: "asr", label: "ASR", icon: "asr", modal: "asr" as const },
  { id: "delay", label: "Delay Codes", icon: "delay", modal: "delay" as const },
  { id: "loadsheet", label: "Loadsheet", icon: "loadsheet", modal: "loadsheet" as const },
  { id: "flighttools", label: "Flight Tools", icon: "flighttools", modal: "flighttool" as const },
  { id: "clock", label: "Clock / Zulu", icon: "clock", modal: "clock" as const },
  { id: "notam", label: "NOTAM", icon: "notam", modal: "notam" as const },
  { id: "crewcenter", label: "Crew Center", icon: "crew", modal: "crewcenter" as const },
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

type AcarsStatus = { status_text?: string; flight_phase?: string };

type ModalKey =
  | "settings"
  | "fuel"
  | "metar"
  | "loadsheet"
  | "asr"
  | "delay"
  | "opt"
  | "flighttool"
  | "clock"
  | "notam"
  | "crewcenter"
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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("jalApiKey") : null;
        if (!stored) {
          router.replace("/");
          return;
        }
        setApiKey(stored);

        // 1) verify via internal route (ถ้าต้องการให้มันยังทำงานร่วมกับระบบเดิม)
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

        // provisional info
        const provisional: { jalId?: string; name?: string } = {
          jalId: verifyData?.user?.pilot_id || verifyData?.user?.pilotid || verifyData?.user?.id,
          name: verifyData?.user?.name || verifyData?.user?.fname,
        };

        // 2) fetch from proxy (จะได้ data.name ชัวร์ ไม่ติด CORS)
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
            // ถ้า upstream 4xx/5xx ก็ fallback
            setUser(provisional);
          }
        } catch {
          // network/cors/etc. fallback
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
      if (typeof window !== "undefined") localStorage.removeItem("jalApiKey");
    } catch {}
    toast("Signed out", { icon: "👋" });
    router.replace("/");
    if (typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 80);
    }
    setAuthBusy(false);
  }, [router]);

  // --- UTC clock & Acars ----------------------------------------------------
  const [utcTime, setUtcTime] = useState<string>(() => {
    if (typeof window === "undefined") return "--:--";
    return new Date().toISOString().substr(11, 5);
  });

  const [pilotId, setPilotId] = useState("");
  const [simbriefId, setSimbriefId] = useState("");
  const [flight, setFlight] = useState({ dpt: "-", arr: "-" });
  const [acarsStatus, setAcarsStatus] = useState<AcarsStatus>({});

  const [loadsheetData, setLoadsheetData] = useState<Partial<LoadsheetFields>>({});
  const [countdown, setCountdown] = useState("");

  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);

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

  // Load saved settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setPilotId(localStorage.getItem("pilotId") || "");
      setSimbriefId(localStorage.getItem("simbriefId") || "");
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

  // ACARS fetch
  useEffect(() => {
    if (!pilotId) return;
    let cancelled = false;
    const fetchAcars = async () => {
      try {
        const response = await fetch(`https://crew.jalvirtual.com/api/acars?pilotId=${encodeURIComponent(pilotId)}`);
        if (!response.ok) throw new Error("ACARS HTTP error");
        const data = await response.json();
        if (!cancelled) setAcarsStatus(data);
      } catch {}
    };
    fetchAcars();
    const iv = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") fetchAcars();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [pilotId]);

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

  // Update flight & loadsheet
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

  // Save settings
  const handleSaveSettings = useCallback(
    (p: string, s: string) => {
      setPilotId(p);
      setSimbriefId(s);
      try {
        localStorage.setItem("pilotId", p);
        localStorage.setItem("simbriefId", s);
      } catch {}
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
      React.memo(function ButtonTileInner({ children, onClick, href, external, id }: { children: React.ReactNode; onClick?: () => void; href?: string; external?: boolean; id: string }) {
        const base =
          "relative w-full aspect-square min-h-[96px] sm:min-h-[112px] md:min-h-[128px] lg:min-h-[144px] flex flex-col items-center justify-center font-medium rounded-3xl shadow-sm transition-all duration-300 hover:shadow-2xl border group overflow-hidden focus-within:ring-2 focus-within:ring-rose-400/50";
        const style = isDark ? "bg-gray-900/60 border-white/10 text-white hover:border-rose-400/40" : "bg-white/70 border-black/5 text-gray-900 hover:border-rose-300/60 backdrop-blur";

        const gradient = (
          <>
            <div className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:linear-gradient(transparent,black,transparent)] opacity-60">
              <div className="absolute -inset-[2px] rounded-3xl bg-[conic-gradient(var(--tw-gradient-stops))] from-rose-500 via-amber-400 to-rose-600 animate-[spin_10s_linear_infinite] motion-reduce:animate-none" />
            </div>
            <div className="pointer-events-none absolute -inset-6 rounded-[2.25rem] blur-2xl opacity-20 bg-gradient-to-br from-rose-500/30 via-amber-400/30 to-fuchsia-500/30" />
          </>
        );

        const body = (
          <div className={`${base} ${style}`}>
            {gradient}
            <div className="relative z-10 w-[88%] h-[88%] rounded-2xl flex flex-col items-center justify-center bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
              {children}
            </div>
          </div>
        );

        const commonProps = {
          className: "block",
          rel: external ? "noopener noreferrer" : undefined,
          target: external ? "_blank" : undefined,
        } as const;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            transition={buttonTransition}
            data-tile-id={id}
          >
            {href ? (
              <Link href={href} {...commonProps}>
                {body}
              </Link>
            ) : (
              <button type="button" onClick={onClick} className="block w-full focus:outline-none" aria-label="Open module">
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
    if (user?.name) return user.name;        // ✅ ควรเห็น "Welcome, {data.name}"
    if (user?.jalId) return String(user.jalId);
    if (apiKey) return maskKey(apiKey);      // fallback ขั้นสุดท้าย
    return "Pilot";
  }, [user, apiKey]);

  return (
    <div className={`${poppins.className} relative w-full min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-gray-950 text-white" : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900"}`}>
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20 dark:opacity-10 transition-opacity duration-700">
        <Image src={isDark ? bgDark : bg} alt="JAL Background" fill sizes="100vw" style={{ objectFit: "cover" }} priority />
        {/* decorative gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 w-[40rem] h-[40rem] rounded-full bg-rose-400/25 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[36rem] h-[36rem] rounded-full bg-amber-300/20 blur-3xl animate-pulse-slower" />
        </div>
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

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className={`relative z-10 flex items-center justify-between w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-4 ${isDark ? "bg-gray-900/70 border-white/10 text-white" : "bg-white/80 border-black/10 text-gray-900"} backdrop-blur-md border-b rounded-b-xl shadow-sm`}
        onMouseEnter={() => setIsHoveringHeader(true)}
        onMouseLeave={() => setIsHoveringHeader(false)}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-rose-600/20 to-amber-400/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              animate={{ rotate: isHoveringHeader ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight jal-title-shine relative z-10">
              Japan Airline Virtuals
            </h1>
            <span className={`${isDark ? "text-rose-300" : "text-rose-600"} text-xs font-medium relative z-10`}>Electronic Flight Bag</span>
          </div>
          <motion.span
            className={`inline-flex items-center px-3 py-1.5 rounded-full ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-black/10 text-gray-900"} border text-sm font-medium shadow-inner`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" aria-hidden /> UTC{" "}
            <time suppressHydrationWarning>{utcTime}</time>
          </motion.span>
        </div>

        {/* Right cluster: Theme + Welcome + Sign out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme */}
          <motion.button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDark ? "hover:bg-white/10 text-gray-200" : "hover:bg-black/5 text-gray-700"} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60`}
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon={isDark ? "mdi:weather-sunny" : "mdi:weather-night"} className="text-xl" />
          </motion.button>

          {/* JAL user chip */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/10"} shadow-inner`}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="w-[22px] h-[22px] rounded-full bg-rose-500/70 ring-2 ring-white/20 inline-flex items-center justify-center text-[11px] text-white font-bold">
                J
              </span>
              <span className="text-sm font-medium max-w-[12rem] truncate">
                {`Welcome, ${userDisplay}`}
              </span>
            </motion.div>
            <motion.button
              onClick={handleLogout}
              disabled={authBusy}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-black/10 hover:bg-black/5"}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign out
            </motion.button>
          </div>

          {/* Settings shortcut */}
          <motion.button
            onClick={() => setActiveModal("settings")}
            className="p-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
            aria-label="Settings"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="mdi:cog" className="text-lg" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative z-10 w-full px-4 sm:px-6 pt-8 pb-28">
        <div className="w-full max-w-screen-xl mx-auto">
          {/* Button Grid */}
          <motion.div variants={gridAnim} initial="hidden" animate="show" className="grid w-full gap-3 sm:gap-4 md:gap-5 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
            {BUTTONS.map((b) => {
              const iconBg = isDark ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10";
              const commonInner = (
                <>
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl ${iconBg} mb-2 transition-colors shadow-sm shrink-0 ring-1 ring-inset ring-white/10`}>
                    <CustomIcon iconName={b.icon} className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-sm font-semibold text-center tracking-wide">{b.label}</span>
                </>
              );
              if ("modal" in b && (b as any).modal) {
                return (
                  <ButtonTile key={b.id} id={b.id} onClick={() => setActiveModal((b as any).modal as ModalKey)}>
                    {commonInner}
                  </ButtonTile>
                );
              }
              if ((b as any).href) {
                return (
                  <ButtonTile key={b.id} id={b.id} href={(b as any).href} external={(b as any).external}>
                    {commonInner}
                  </ButtonTile>
                );
              }
              return <ButtonTile key={b.id} id={b.id}>{commonInner}</ButtonTile>;
            })}
          </motion.div>

          {/* Loadsheet Summary (optional) */}
          {loadsheetData.costIndex && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full max-w-4xl mx-auto mt-8 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white/90 border-black/10 text-gray-900"} backdrop-blur-sm border p-5 sm:p-6 rounded-2xl shadow-sm`}
              aria-labelledby="loadsheet-heading"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="loadsheet-heading" className="text-base sm:text-lg font-semibold flex items-center">
                  <Icon icon="mdi:clipboard-text" className={`${isDark ? "text-rose-300" : "text-rose-600"} mr-2`} />
                  Loadsheet Summary
                </h3>
                <span className={`text-[11px] sm:text-xs px-2 py-1 ${isDark ? "bg-white/5 text-white" : "bg-black/5 text-gray-900"} rounded-full`}>SimBrief ID: {simbriefId}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <SummaryCell title="Dep UTC" value={loadsheetData.date ? new Date(loadsheetData.date).toISOString().substr(11, 5) : "-"} theme={isDark ? "dark" : "light"} />
                <SummaryCell title="Countdown" value={countdown} theme={isDark ? "dark" : "light"} />
                <SummaryCell title="Cost Index" value={loadsheetData.costIndex} theme={isDark ? "dark" : "light"} />
                <SummaryCell title="PAX" value={loadsheetData.pax} theme={isDark ? "dark" : "light"} />
                <SummaryCell title="ZFW" value={`${loadsheetData.zfw} / ${loadsheetData.zfwMax} kg`} theme={isDark ? "dark" : "light"} />
                <SummaryCell title="TOW" value={`${loadsheetData.tow} / ${loadsheetData.towMax} kg`} theme={isDark ? "dark" : "light"} />
                <div className={`${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} col-span-1 md:col-span-2 p-3 rounded-lg transition-colors`}>
                  <p className={`${isDark ? "text-gray-300" : "text-gray-600"} text-xs font-medium mb-1`}>Route</p>
                  <p className="font-mono text-xs overflow-x-auto" aria-label="Flight route">
                    {loadsheetData.route}
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 w-full py-3 ${isDark ? "bg-gray-900/70 border-white/10 text-white" : "bg-white/80 border-black/10 text-gray-900"} backdrop-blur-sm border-t text-center text-sm tracking-wide shadow-sm`}>
        <div className="flex justify-center items-center space-x-4">
          <span className="flex items-center">
            <Icon icon="mdi:airplane" className={`${isDark ? "text-rose-300" : "text-rose-600"} mr-1`} /> Japan Airlines Virtual
          </span>
          <span aria-hidden>•</span>
          <span>EFB Developed by Y. Zhong Jie</span>
          <span aria-hidden>•</span>
          <span className="flex items-center">
            <Icon icon="mdi:flower" className={`${isDark ? "text-rose-300" : "text-rose-600"} mr-1`} /> v2.3.0
          </span>
        </div>
      </footer>

      {/* Backdrop for modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {/* settings */}
        {activeModal === "settings" && (
          <motion.div key="settings" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <SettingsModal show onClose={() => setActiveModal(null)} onSave={handleSaveSettings} initialPilotId={pilotId} initialSimbriefId={simbriefId} initialHoppieId={""} />
          </motion.div>
        )}

        {/* fuel */}
        {activeModal === "fuel" && (
          <motion.div key="fuel" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <IFuelModal
              show
              onClose={() => setActiveModal(null)}
              onConfirm={async () => {
                toast.success("Fuel Request Sent!", {
                  icon: "⛽",
                  style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                });
                return "Fuel Request Sent!";
              }}
            />
          </motion.div>
        )}

        {/* metar */}
        {activeModal === "metar" && (
          <motion.div key="metar" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <WeatherModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {/* loadsheet */}
        {activeModal === "loadsheet" && (
          <motion.div key="loadsheet" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <LoadsheetModal
              show
              onClose={() => setActiveModal(null)}
              onAutofill={async (id: string) => {
                const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`, { cache: "no-store" });
                return res.json();
              }}
              hoppieId={pilotId}
              simbriefId={simbriefId}
              onSubmit={async () => {
                toast.success("Loadsheet Sent!", {
                  icon: "📦",
                  style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                });
                return "Loadsheet Sent!";
              }}
            />
          </motion.div>
        )}

        {/* asr */}
        {activeModal === "asr" && (
          <motion.div key="asr" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <ASRModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {/* delay */}
        {activeModal === "delay" && (
          <motion.div key="delay" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DelayCodeModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {/* opt */}
        {activeModal === "opt" && (
          <motion.div key="opt" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <OPTModal
              show
              onClose={() => setActiveModal(null)}
              onAutofill={async (id: string) => {
                const res = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`, { cache: "no-store" });
                return res.json();
              }}
              hoppieId={pilotId}
              simbriefId={simbriefId}
              onSubmit={async () => {
                toast.success("OPT Sent!", {
                  icon: "📈",
                  style: { background: isDark ? "#111827" : "#ffffff", color: isDark ? NIGHT_TEXT : DAY_TEXT, border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`, boxShadow: "0 4px 20px rgba(182, 12, 24, 0.15)" },
                });
                return "OPT Sent!";
              }}
            />
          </motion.div>
        )}

        {/* flighttools */}
        {activeModal === "flighttool" && (
          <motion.div key="flighttool" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <FlighttoolModal show onClose={() => setActiveModal(null)} simbriefId={simbriefId} />
          </motion.div>
        )}

        {/* clock */}
        {activeModal === "clock" && (
          <motion.div key="clock" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <ClockModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {/* notam */}
        {activeModal === "notam" && (
          <motion.div key="notam" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <NotamModal show onClose={() => setActiveModal(null)} origin={flight.dpt} destination={flight.arr} />
          </motion.div>
        )}

        {/* crew center */}
        {activeModal === "crewcenter" && (
          <motion.div key="crewcenter" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <CrewCenterModal show onClose={() => setActiveModal(null)} />
          </motion.div>
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
