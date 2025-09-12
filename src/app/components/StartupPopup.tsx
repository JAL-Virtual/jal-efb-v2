"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  onFinish: () => void;
  /** New: pass the verified API key if available */
  apiKey?: string | null;
  /** Legacy: still supported for back-compat */
  jalId?: string | number | null;
};

/** Mask API keys like ABCD••••WXYZ; short keys become •••• */
function maskKey(input?: string | null) {
  const v = (input ?? "").trim();
  if (!v) return "";
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}

/** Robust name picker in case the payload shape differs */
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

export default function StartupPopup({ onFinish, apiKey, jalId }: Props) {
  const masked = useMemo(() => maskKey(apiKey), [apiKey]);
  const legacyId = useMemo(() => String(jalId ?? "").trim(), [jalId]);

  // Prefer API key if present; otherwise fall back to jalId
  const idForUi = masked || legacyId || "UNKNOWN";
  const idLabel = apiKey ? "API Key" : "Pilot ID";

  // NEW: display name (from /api/jal/user when apiKey is present)
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    async function run() {
      if (!apiKey) {
        setDisplayName(null);
        return;
      }
      try {
        const res = await fetch("/api/jal/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
          cache: "no-store",
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok) {
          const name = pickName(json);
          setDisplayName(name ?? null);
        } else {
          // keep fallback
          setDisplayName(null);
        }
      } catch {
        if (!cancelled) setDisplayName(null);
      }
    }

    run();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [apiKey]);

  const firstLine = useMemo(() => {
    // If we have a name, show: "Authorizing Pilot: {name} • API Key: ABCD••••WXYZ"
    if (displayName) {
      return `Authorizing Pilot: ${displayName} • ${idLabel}: ${idForUi}`;
    }
    // Otherwise original behavior
    return `Authorizing ${idLabel}: ${idForUi}`;
  }, [displayName, idForUi, idLabel]);

  const messages = useMemo(
    () => [
      firstLine,
      "Initializing Flight Control Systems",
      "Calibrating Navigation Database",
      "Establishing Link with JAL Virtual Network",
      "Final Checks Completed — Systems Online",
    ],
    [firstLine]
  );

  const [visible, setVisible] = useState(true);
  const [currentLine, setCurrentLine] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [calledFinish, setCalledFinish] = useState(false); // ensure onFinish runs once

  const total = messages.length;
  const progress = Math.round((Math.min(currentLine, total) / total) * 100);

  const handleFinish = useCallback(() => {
    if (calledFinish) return;
    setCalledFinish(true);
    setVisible(false);
    // let the exit animation play a beat
    setTimeout(() => onFinish(), 400);
  }, [calledFinish, onFinish]);

  const handleSkip = () => {
    setCurrentLine(total);
    setTypedText("");
    setCharIndex(0);
  };

  useEffect(() => {
    if (!visible || finished) return;

    if (currentLine < total) {
      const line = messages[currentLine] || "";
      if (charIndex === 0) setTypedText("");

      const tickMs = 28 + Math.floor(Math.random() * 18);
      const id = setTimeout(() => {
        const next = charIndex + 1;
        setTypedText(line.slice(0, next));
        setCharIndex(next);

        if (next >= line.length) {
          setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setCharIndex(0);
            setTypedText("");
          }, 340);
        }
      }, tickMs);

      return () => clearTimeout(id);
    }

    // finished typing all lines
    const done = setTimeout(() => {
      setFinished(true);
      handleFinish();
    }, 800);

    return () => clearTimeout(done);
  }, [visible, currentLine, charIndex, messages, total, finished, handleFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Rnd
            default={{ x: 120, y: 90, width: 680, height: 420 }}
            bounds="window"
            minWidth={460}
            minHeight={280}
            dragHandleClassName="startup-header"
            className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-emerald-400/25"
          >
            <motion.div
              className="h-full w-full relative bg-gradient-to-b from-[#04110a] to-black"
              initial={{ scale: 0.98, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="startup-header relative z-10 flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-gray-900/80 via-gray-800/70 to-gray-900/80 text-emerald-300 border-b border-emerald-400/20 cursor-move select-none">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-500/80 ring-1 ring-red-200/40" />
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-500/80 ring-1 ring-yellow-200/40" />
                  <span className="inline-block h-3 w-3 rounded-full bg-green-500/80 ring-1 ring-green-200/40" />
                  <span className="ml-2 font-semibold tracking-wide">JAL Virtual • Boot Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSkip}
                    className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-400/20 hover:bg-emerald-500/20 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleFinish}
                    className="text-sm opacity-70 hover:opacity-100 transition px-1.5"
                    aria-label="Close"
                  >
                    [×]
                  </button>
                </div>
              </div>

              {/* Console messages */}
              <div className="relative z-10 p-4 h-[calc(100%-92px)] overflow-y-auto text-emerald-300 font-mono text-[13px] leading-relaxed">
                {messages.slice(0, Math.min(currentLine, total)).map((msg, i) => (
                  <div key={i} className="mb-1.5 flex items-start gap-2">
                    <span className="text-emerald-400/80">{">"}</span>
                    <span>{msg}</span>
                    <span className="ml-2 text-emerald-300/70">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        className="text-emerald-400"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                      </svg>
                    </span>
                  </div>
                ))}

                {currentLine < total && (
                  <div className="mb-1.5 flex items-start gap-2">
                    <span className="text-emerald-400/80">{">"}</span>
                    <span>{typedText}</span>
                    <span className="ml-1 animate-pulse">_</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="relative z-10 px-4 pb-3">
                <div className="flex items-center justify-between text-[11px] text-emerald-300/70 mb-1">
                  <span>System Boot Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-emerald-900/40 overflow-hidden ring-1 ring-emerald-400/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                  />
                </div>
              </div>
            </motion.div>
          </Rnd>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
