"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";

// --- Props for embedded usage -----------------------------------------------
export default function MapComponent({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  // --- Load Leaflet CSS on the client to avoid SSR flicker -------------------
  if (typeof window !== "undefined") {
    const id = "leaflet-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
  }

  // --- Fonts (Fira Sans + Zen Maru Gothic) -----------------------------------
  if (typeof window !== "undefined") {
    const id = "fira-sans-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600;700&family=Zen+Maru+Gothic:wght@500;700&display=swap";
      document.head.appendChild(link);
    }
  }

  // --- Dynamic (client-only) react-leaflet imports ---------------------------
  const MapContainer = dynamic(
    async () => (await import("react-leaflet")).MapContainer,
    { ssr: false }
  );
  const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, {
    ssr: false,
  });
  const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
    ssr: false,
  });
  const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
    ssr: false,
  });
  const ZoomControl = dynamic(async () => (await import("react-leaflet")).ZoomControl, {
    ssr: false,
  });

  // --- Constants --------------------------------------------------------------
  const AIRCRAFT_ICON_URL = "https://jalvirtual.com/assets/img/acars/aircraft.png";
  const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"; // CARTO Positron (free, no key)

  // --- Types ------------------------------------------------------------------
  interface Flight {
    id?: string;
    ident?: string;
    status?: string;
    status_text?: string;
    flight_number?: string | number;
    dpt_airport_id?: string;
    arr_airport_id?: string;
    user?: { name?: string };
    airline?: { icao?: string; iata?: string };
    aircraft?: { registration?: string; icao?: string };
    position?: { lat: number; lon: number; heading?: number; altitude?: number };
  }

  // --- Helpers ----------------------------------------------------------------
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const quantize = (heading: number, step = 5) => Math.round(heading / step) * step;

  // Icon cache to prevent DOM churn on rotation changes
  const iconCache = new Map<number, L.DivIcon>();
  function getPlaneIcon(heading = 0) {
    const h = quantize((heading % 360 + 360) % 360, 5);
    const cached = iconCache.get(h);
    if (cached) return cached;
    const icon = L.divIcon({
      className: "plane-icon",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -21],
      html: `
      <img src="${AIRCRAFT_ICON_URL}" width="42" height="42" alt="Plane"
           style="transform: rotateZ(${h}deg); display:block; will-change: transform; image-rendering: -webkit-optimize-contrast;"/>
    `,
    });
    iconCache.set(h, icon);
    return icon;
  }

  function getCallsign(flight: Flight) {
    if (flight.airline?.icao && flight.flight_number !== undefined && flight.flight_number !== null) {
      const icao = flight.airline.icao;
      const iata = flight.airline.iata;
      const fn = String(flight.flight_number).padStart(2, "0");
      return iata ? `${icao}${fn} / ${iata}${fn}` : `${icao}${fn}`;
    }
    return flight.ident || String(flight.flight_number ?? "Unknown");
  }

  // Sakura petals with reduced-motion support
  function SakuraPetals() {
    let prefersReduced = false;
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    const count = prefersReduced ? 0 : 10;

    const petals = useMemo(
      () =>
        Array.from({ length: count }, () => ({
          left: `${Math.random() * 100}%`,
          delay: `${Math.random() * 4}s`,
          duration: `${6 + Math.random() * 7}s`,
          size: 10 + Math.random() * 12,
          rotateStart: Math.random() * 360,
          rotateEnd: Math.random() * 360 + 360,
        })),
      [count]
    );

    if (!count) return null;

    return (
      <>
        {petals.map((p, i) => (
          <svg
            key={i}
            width={p.size}
            height={p.size}
            viewBox="0 0 20 22"
            fill="none"
            style={{
              position: "absolute",
              left: p.left,
              top: "-30px",
              pointerEvents: "none",
              animation: `sakura-fall ${p.duration} linear ${p.delay} infinite`,
              transformOrigin: "center center",
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 0 C7 6,0 7,5 13 C1 14,6 21,10 17 C14 21,19 14,15 13 C20 7,13 6,11 0"
              fill="#b60c18"
              opacity="0.65"
            />
            <ellipse cx="10" cy="16" rx="3.2" ry="1.1" fill="#f8c3cd" opacity="0.25" />
            <style>{`
            @keyframes sakura-fall {
              0% { transform: translateY(0) rotate(${p.rotateStart}deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(${p.rotateEnd}deg); opacity: 0; }
            }
          `}</style>
          </svg>
        ))}
      </>
    );
  }

  function Badge({ children }: { children: ReactNode }) {
    return (
      <span
        style={{
          display: "inline-block",
          background: "#fbe6e9",
          color: "#b60c18",
          border: "1px solid #f0c6ca",
          borderRadius: 999,
          padding: "4px 10px",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.02em",
        }}
      >
        {children}
      </span>
    );
  }

  // --- Main component state ---------------------------------------------------
  const [aircraft, setAircraft] = useState<Flight[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const resizeTimer = useRef<number | null>(null);

  const fetchAcars = useCallback(async () => {
    try {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setFetchError(null);
      const res = await fetch("/api/acars", { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("API returned " + res.status);
      const data = await res.json();
      const list: Flight[] = Array.isArray(data?.data) ? data.data : [];
      const clean = list
        .filter((p) => p?.position && typeof p.position.lat === "number" && typeof p.position.lon === "number")
        .map((p) => ({
          ...p,
          position: {
            lat: clamp(p.position!.lat, -85, 85),
            lon: clamp(p.position!.lon, -179.999, 179.999),
            heading: clamp(Number(p.position!.heading || 0), 0, 360),
            altitude: Math.max(0, Number(p.position!.altitude || 0)),
          },
        }));
      setAircraft(clean);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setFetchError("Failed to fetch ACARS data: " + (e?.message || e));
      setAircraft([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcars();
    const id = window.setInterval(fetchAcars, 15000);

    const onResize = () => {
      if (resizeTimer.current) window.clearTimeout(resizeTimer.current);
      resizeTimer.current = window.setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
      window.removeEventListener("resize", onResize);
    };
  }, [fetchAcars]);

  // Sizing based on embedded vs full page
  const containerStyle: React.CSSProperties = embedded
    ? {
        width: "100%",
        height: "70vh",
        position: "relative",
        fontFamily:
          "'Fira Sans', 'Zen Maru Gothic', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
        background: "#faf9f7",
        color: "#3a0d0e",
        overflow: "hidden",
      }
    : {
        width: "100vw",
        height: "100vh",
        position: "relative",
        fontFamily:
          "'Fira Sans', 'Zen Maru Gothic', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif",
        background: "#faf9f7",
        color: "#3a0d0e",
        overflow: "hidden",
      };

  return (
    <div style={containerStyle}>
      <SakuraPetals />

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
        }}
      >
        {embedded ? (
          <button
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 16px",
              borderRadius: 999,
              fontWeight: 700,
              color: "#b60c18",
              fontSize: 16,
              letterSpacing: "0.02em",
              boxShadow: "0 8px 24px rgba(182,12,24,0.15)",
              border: "1px solid rgba(182,12,24,0.45)",
              transition: "transform .15s ease, background .2s ease)",
              backdropFilter: "blur(6px)",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Close
          </button>
        ) : (
          <a
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 16px",
              borderRadius: 999,
              fontWeight: 700,
              color: "#b60c18",
              fontSize: 16,
              letterSpacing: "0.02em",
              boxShadow: "0 8px 24px rgba(182,12,24,0.15)",
              textDecoration: "none",
              border: "1px solid rgba(182,12,24,0.45)",
              transition: "transform .15s ease, background .2s ease)",
              backdropFilter: "blur(6px)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Home
          </a>
        )}

        <Badge>
          {loading ? "Loading flights…" : `${aircraft.length} active flight${aircraft.length === 1 ? "" : "s"}`}
        </Badge>
      </div>

      {fetchError && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: 64,
            left: 16,
            zIndex: 10000,
            background: "#b60c18",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            boxShadow: "0 12px 28px rgba(182,12,24,0.25)",
            maxWidth: 420,
          }}
        >
          {fetchError}
        </div>
      )}

      {/* Map */}
      <div style={{ width: "100%", height: embedded ? "100%" : "100vh", zIndex: 1 }}>
        <MapContainer
          ref={mapRef as any}
          center={[35, 137]}
          zoom={5}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
          preferCanvas
          attributionControl={false}
          zoomAnimation
          markerZoomAnimation
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={90}
          whenReady={() => {
            setTimeout(() => mapRef.current?.invalidateSize(), 0);
          }}
        >
          <TileLayer
            attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> | © CARTO'
            url={TILE_URL}
            updateWhenIdle={false}
            detectRetina
          />
          <ZoomControl position="bottomright" />

          {aircraft.map((flight, idx) => {
            const pos = flight.position;
            if (!pos) return null;
            const key = flight.id || flight.ident || `${flight.airline?.icao}-${flight.flight_number}-${idx}`;
            return (
              <Marker key={key} position={[pos.lat, pos.lon]} icon={getPlaneIcon(pos.heading || 0)}>
                <Popup closeButton={false} autoPanPadding={[40, 40]}>
                  <FlightCard flight={flight} />
                </Popup>
              </Marker>
            );
          })}

          {/* Custom attribution pill */}
          <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: "none" }}>
            <div
              className="leaflet-control"
              style={{
                pointerEvents: "auto",
                background: "rgba(255,255,255,0.9)",
                borderRadius: 999,
                padding: "6px 10px",
                margin: 12,
                fontSize: 11,
                border: "1px solid rgba(240,198,202,0.7)",
                backdropFilter: "blur(6px)",
              }}
            >
              Data: ACARS • Map © OSM • Tiles © CARTO
            </div>
          </div>
        </MapContainer>
      </div>

      {/* Subtle gradient footer ribbon */}
      {!embedded && (
        <div
          style={{
            position: "absolute",
            bottom: -40,
            left: -60,
            right: -60,
            height: 120,
            background: "linear-gradient(90deg, #b60c18, #ea4256)",
            opacity: 0.08,
            filter: "blur(30px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      <style>{`
        .plane-icon img { transform-origin: 50% 50%; }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 14px 40px rgba(182, 12, 24, 0.2);
          border: 1px solid #f0c6ca;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { display: none; }
      `}</style>
    </div>
  );
}

// --- Flight card -----------------------------------------------------------
function FlightCard({ flight }: { flight: any }) {
  const pos = flight.position!;
  const alt = Math.round(Number(pos.altitude || 0));
  const hdg = Math.round(Number(pos.heading || 0));

  function localGetCallsign(f: any) {
    if (f?.airline?.icao && f?.flight_number !== undefined && f?.flight_number !== null) {
      const icao = f.airline.icao;
      const iata = f.airline.iata;
      const fn = String(f.flight_number).padStart(2, "0");
      return iata ? `${icao}${fn} / ${iata}${fn}` : `${icao}${fn}`;
    }
    return f?.ident || String(f?.flight_number ?? "Unknown");
  }

  return (
    <div
      style={{
        minWidth: 230,
        maxWidth: 280,
        background: "linear-gradient(120deg, #faf9f7, #fbe6e9 85%)",
        borderRadius: 16,
        overflow: "hidden",
        color: "#661213",
        userSelect: "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg, #b60c18, #ea4256 90%)",
          color: "white",
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: "0.03em",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        <span style={{ fontSize: 18 }}>✈️</span>
        <span title={localGetCallsign(flight)} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {localGetCallsign(flight)}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              display: "inline-block",
              background: "#fbe6e9",
              color: "#b60c18",
              border: "1px solid #f0c6ca",
              borderRadius: 999,
              padding: "4px 10px",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.02em",
            }}
          >
            👨‍✈️ {flight?.user?.name || "—"}
          </span>
        </div>
        <div style={{ marginBottom: 8, lineHeight: 1.3 }}>
          <b>Aircraft:</b>{" "}
          <span style={{ color: "#b60c18", fontWeight: 800 }}>{flight?.aircraft?.registration || "—"}</span>{" "}
          <span style={{ fontSize: 12, color: "#a05252" }}>({flight?.aircraft?.icao || "—"})</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
          <div>
            <b>ALT:</b> <span style={{ color: "#9b1212" }}>{alt.toLocaleString()} ft</span>
          </div>
          <div>
            <b>HDG:</b> <span style={{ color: "#cc3c3c" }}>{hdg}°</span>
          </div>
        </div>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>
          <span
            style={{
              background: "#fde6e8",
              color: "#a0272a",
              borderRadius: 8,
              padding: "5px 12px",
              display: "inline-block",
            }}
          >
            <b>DEP:</b> {flight?.dpt_airport_id || "—"} <span style={{ margin: "0 7px" }}>→</span> <b>ARR:</b>{" "}
            {flight?.arr_airport_id || "—"}
          </span>
        </div>
        {(flight.status_text || flight.status) && (
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <span
              style={{
                display: "inline-block",
                background: "#fbe6e9",
                color: "#b60c18",
                border: "1px solid #f0c6ca",
                borderRadius: 999,
                padding: "4px 10px",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.02em",
              }}
            >
              {flight.status_text || flight.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
