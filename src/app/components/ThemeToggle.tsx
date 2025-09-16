"use client";

import React from "react";
import { Icon } from "@iconify/react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("theme") as "light" | "dark" | null) ?? null;
      const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextDark = stored ? stored === "dark" : prefersDark;
      setIsDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
    } catch {}
  }, []);

  const toggle = React.useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
      }
      return next;
    });
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-full p-2 transition-colors ${isDark ? "hover:bg-white/10 text-gray-200" : "hover:bg-black/5 text-gray-700"} ${className}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Icon icon={isDark ? "mdi:weather-sunny" : "mdi:weather-night"} className="text-xl" />
    </button>
  );
}
