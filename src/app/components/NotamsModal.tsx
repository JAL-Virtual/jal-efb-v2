'use client';
import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { Icon } from "@iconify/react";

type Notam = {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  date: string;
};

type NotamsModalProps = {
  show: boolean;
  onClose: () => void;
  // kept optional for compatibility if your Dashboard still passes them
  origin?: string;
  destination?: string;
};

const NotamsModal: React.FC<NotamsModalProps> = ({ show, onClose }) => {
  const [icao, setIcao] = useState<string>("");
  const [notams, setNotams] = useState<Notam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (!show) return;
    setError(null);
    setNotams([]);
    setActiveFilter("all");
    // (Optional) preload a common ICAO:
    // setIcao("RJTT");
  }, [show]);

  const canSearch = useMemo(() => /^[A-Za-z]{4}$/.test(icao.trim()), [icao]);

  async function fetchNotams(code?: string) {
    const q = (code ?? icao).trim().toUpperCase();
    setError(null);
    setNotams([]);

    if (!/^[A-Z]{4}$/.test(q)) {
      setError("Please enter a valid 4-letter ICAO (e.g., RJTT).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/notams?icao=${q}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Fetch failed (${res.status})`);
      }
      const payload = await res.json();

      // Normalize provider outputs to our Notam[]
      const normalize = (): Notam[] => {
        if (payload.provider === "avwx") {
          const arr: any[] = Array.isArray(payload.data) ? payload.data : [];
          return arr.map((n: any, idx: number) => {
            const msg: string = n?.text || n?.raw || "NOTAM text unavailable.";
            const sev: Notam["severity"] = /RWY\s?CLSD|RUNWAY\s?CLOSED|AIRPORT\s?CLOSED|VOLCANIC ASH|EMERG|HAZARD/i.test(
              msg
            )
              ? "high"
              : /TWY|TAXIWAY|WORK IN PROGRESS|WIP|OBST/i.test(msg)
              ? "medium"
              : "low";
            const title =
              (n?.type || "NOTAM") +
              (n?.number ? ` ${n.number}` : "") +
              (n?.location ? ` — ${n.location}` : "");
            const date = (n?.effective || n?.created || new Date().toISOString()).slice(0, 10);
            return {
              id: n?.id || `${q}-${idx}`,
              title,
              message: msg,
              severity: sev,
              date,
            };
          });
        }

        // CheckWX variants
        const items: any[] = Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.data?.notams)
          ? payload.data.notams
          : [];
        return items.map((n: any, idx: number) => {
          const msg: string = n?.raw || n?.text || "NOTAM text unavailable.";
          const sev: Notam["severity"] = /RWY\s?CLSD|RUNWAY\s?CLOSED|AIRPORT\s?CLOSED|VOLCANIC ASH|EMERG|HAZARD/i.test(
            msg
          )
            ? "high"
            : /TWY|TAXIWAY|WORK IN PROGRESS|WIP|OBST/i.test(msg)
            ? "medium"
            : "low";
          const title =
            (n?.type || "NOTAM") +
            (n?.number ? ` ${n.number}` : "") +
            (n?.location ? ` — ${n.location}` : "");
          const date = (n?.time_start || n?.created || new Date().toISOString()).slice(0, 10);
          return {
            id: n?.id || n?.notam_id || `CWX-${idx}`,
            title,
            message: msg,
            severity: sev,
            date,
          };
        });
      };

      setNotams(normalize());
    } catch (err: any) {
      console.error("Failed to fetch NOTAMs:", err);
      setError(err?.message || "Failed to fetch NOTAMs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredNotams =
    activeFilter === "all" ? notams : notams.filter((n) => n.severity === activeFilter);

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <div className="relative w-full max-w-6xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">NOTAMs</h2>
          </div>
          {/* close button removed; wrapper handles closing */}
        </div>

        {/* Search Bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <input
                value={icao}
                onChange={(e) => setIcao(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSearch) fetchNotams();
                }}
                placeholder="e.g., RJTT"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                maxLength={4}
                aria-label="ICAO"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500">ICAO</span>
            </div>

            <button
              onClick={() => fetchNotams()}
              disabled={!canSearch || isLoading}
              className={`px-4 py-2.5 rounded-lg text-white text-sm font-medium inline-flex items-center gap-2 ${
                !canSearch || isLoading
                  ? "bg-blue-600/50 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <Icon icon="line-md:loading-twotone-loop" className="animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Icon icon="mdi:magnify" />
                  Search
                </>
              )}
            </button>

            {/* Quick shortcuts (optional) */}
            <div className="flex items-center gap-2 text-xs">
              <button
                className="px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                onClick={() => { setIcao("RJTT"); fetchNotams("RJTT"); }}
              >
                RJTT
              </button>
              <button
                className="px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                onClick={() => { setIcao("RJAA"); fetchNotams("RJAA"); }}
              >
                RJAA
              </button>
              <button
                className="px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                onClick={() => { setIcao("RJCH"); fetchNotams("RJCH"); }}
              >
                RJCH
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[600px] overflow-hidden">
          {/* Filters Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-1">
              {(["all", "high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveFilter(level)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    activeFilter === level ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <Icon
                    icon={
                      level === "all"
                        ? "mdi:format-list-bulleted"
                        : level === "high"
                        ? "mdi:alert-octagon"
                        : level === "medium"
                        ? "mdi:alert"
                        : "mdi:information"
                    }
                    width={20}
                    className={
                      level === "high"
                        ? "text-red-400"
                        : level === "medium"
                        ? "text-yellow-400"
                        : level === "low"
                        ? "text-green-400"
                        : ""
                    }
                  />
                  <span>
                    {level === "all"
                      ? "All NOTAMs"
                      : level === "high"
                      ? "High priority"
                      : level === "medium"
                      ? "Medium priority"
                      : "Low priority"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* NOTAMs List */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
                <Icon icon="mdi:airplane" width={24} className="text-blue-400" />
                <span>Active NOTAMs ({filteredNotams.length})</span>
              </h3>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Icon icon="line-md:loading-twotone-loop" className="text-blue-500 mb-3 animate-spin" width={42} />
                  <p className="text-gray-400">Loading NOTAMs…</p>
                </div>
              ) : error ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                  <Icon icon="mdi:alert-circle" width={48} className="mx-auto text-red-500 mb-4" />
                  <h4 className="text-xl font-medium text-gray-300 mb-2">{error}</h4>
                  <button
                    onClick={() => fetchNotams()}
                    disabled={!canSearch}
                    className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredNotams.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                  <Icon icon="mdi:check-circle" width={48} className="mx-auto text-green-500 mb-4" />
                  <h4 className="text-xl font-medium text-gray-300 mb-2">No NOTAMs</h4>
                  <p className="text-gray-400">There are currently no NOTAMs for this ICAO.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotams.map((notam) => (
                    <div key={notam.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className={`p-4 flex items-center space-x-3 ${
                        notam.severity === "high"
                          ? "bg-red-500"
                          : notam.severity === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}>
                        <Icon
                          icon={
                            notam.severity === "high"
                              ? "mdi:alert-octagon"
                              : notam.severity === "medium"
                              ? "mdi:alert"
                              : "mdi:information"
                          }
                          width={24}
                          className="text-white"
                        />
                        <div>
                          <h4 className="text-lg font-semibold text-white">{notam.title}</h4>
                          <p className="text-sm text-white/90">{notam.date}</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-gray-300 whitespace-pre-line">{notam.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NotamsModal;
