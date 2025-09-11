"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamically load Fira Sans from Google Fonts
if (typeof window !== "undefined") {
  const id = "fira-sans-font-link";
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }
}

const AIRCRAFT_ICON_URL = "https://crew.jalvirtual.com/assets/img/acars/aircraft.png";
const JAL_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Japan_Airlines_logo.svg/2560px-Japan_Airlines_logo.svg.png";

// Custom plane icon that rotates to heading
function getPlaneIcon(heading = 0) {
  return L.divIcon({
    className: "",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
    html: `
      <img 
        src="${AIRCRAFT_ICON_URL}" 
        width="42" 
        height="42"
        style="transform: rotateZ(${heading}deg); display: block;"
        alt="Plane"
      />
    `,
  });
}

// Helper to display ICAO/IATA callsign with zero-padded number (2 digits)
function getCallsign(flight: any) {
  if (flight.airline?.icao && flight.flight_number) {
    const icao = flight.airline.icao;
    const iata = flight.airline.iata;
    // Pad to 2 digits (e.g., 2 -> 02, 20 -> 20)
    const fn = flight.flight_number.toString().padStart(2, "0");
    return iata ? `${icao}${fn} / ${iata}${fn}` : `${icao}${fn}`;
  }
  return flight.ident || flight.flight_number || "Unknown";
}

// Sakura petals component: floating cherry blossoms on the map container
function SakuraPetals() {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${5 + Math.random() * 6}s`,
    size: 10 + Math.random() * 15,
    rotateStart: Math.random() * 360,
    rotateEnd: Math.random() * 360 + 360,
  }));

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
            rotate: `${p.rotateStart}deg`,
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
              0% {
                transform: translateY(0) rotate(${p.rotateStart}deg);
                opacity: 1;
              }
              100% {
                transform: translateY(110vh) rotate(${p.rotateEnd}deg);
                opacity: 0;
              }
            }
          `}</style>
        </svg>
      ))}
    </>
  );
}

export default function MapComponent() {
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAcars = async () => {
      try {
        setFetchError(null);
        const res = await fetch("/api/acars");
        if (!res.ok) throw new Error("API returned " + res.status);
        const data = await res.json();
        if (isMounted && data && Array.isArray(data.data)) {
          setAircraft(
            data.data.filter(
              (p: any) =>
                p.position &&
                typeof p.position.lat === "number" &&
                typeof p.position.lon === "number"
            )
          );
        } else {
          setAircraft([]);
        }
      } catch (e: any) {
        setFetchError("Failed to fetch ACARS data: " + (e.message || e));
      }
    };
    fetchAcars();
    const interval = setInterval(fetchAcars, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        fontFamily: "'Fira Sans', Arial, sans-serif",
        backgroundColor: "#faf9f7",
        overflow: "hidden",
      }}
    >
      <SakuraPetals />

      {/* Home button - only one, top right */}
      <a
        href="/"
        style={{
          position: "absolute",
          top: 22,
          right: 28,
          zIndex: 10001,
          background: "rgba(255,255,255,0.95)",
          padding: "8px 24px",
          borderRadius: 999,
          fontWeight: 700,
          color: "#b60c18",
          fontSize: 18,
          letterSpacing: "0.02em",
          boxShadow: "0 4px 16px 0 rgba(182,12,24,0.2)",
          textDecoration: "none",
          border: "1.5px solid #b60c18",
          transition: "background .2s, box-shadow .2s",
          fontFamily: "'Fira Sans', Arial, sans-serif",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#fbe6e9")}
        onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
      >
        Home
      </a>

      {fetchError && (
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            zIndex: 10000,
            background: "#b60c18",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            fontWeight: "bold",
            fontFamily: "'Fira Sans', Arial, sans-serif",
          }}
        >
          {fetchError}
        </div>
      )}

      <MapContainer
        center={[35, 137]} // Japan
        zoom={5}
        style={{ width: "100vw", height: "100vh", zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {aircraft.map((flight, idx) => {
          const pos = flight.position;
          if (!pos) return null;
          return (
            <Marker
              key={flight.id || flight.ident || idx}
              position={[pos.lat, pos.lon]}
              icon={getPlaneIcon(pos.heading || 0)}
            >
              <Popup>
                <div
                  style={{
                    minWidth: 220,
                    fontFamily: "'Fira Sans', Arial, sans-serif",
                    background: "linear-gradient(120deg, #faf9f7, #fbe6e9 85%)",
                    borderRadius: 14,
                    boxShadow: "0 2px 12px #b60c1822",
                    border: "1.5px solid #f0c6ca",
                    padding: 0,
                    overflow: "hidden",
                    color: "#661213",
                    userSelect: "none",
                  }}
                >
                  {/* Header Bar */}
                  <div
                    style={{
                      background: "linear-gradient(90deg, #b60c18, #ea4256 90%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: "0.02em",
                      padding: "7px 13px 6px 13px",
                      borderRadius: "14px 14px 0 0",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      minHeight: 32,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 200,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>✈️</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 140,
                        display: "inline-block",
                      }}
                      title={getCallsign(flight)}
                    >
                      {getCallsign(flight)}
                    </span>
                  </div>

                  <div style={{ padding: "16px 16px 12px 16px" }}>
                    {/* Pilot Row */}
                    <div
                      style={{
                        marginBottom: 6,
                        fontWeight: 600,
                        color: "#a53030",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          background: "#fbe6e9",
                          color: "#b60c18",
                          borderRadius: 7,
                          padding: "3px 10px",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        👨‍✈️ {flight?.user?.name || "—"}
                      </span>
                    </div>

                    {/* Aircraft Row */}
                    <div style={{ marginBottom: 7 }}>
                      <b>Aircraft:</b>{" "}
                      <span style={{ color: "#b60c18", fontWeight: 700 }}>
                        {flight?.aircraft?.registration || "—"}
                      </span>
                      <span
                        style={{ marginLeft: 6, fontSize: 13, color: "#d97d7d" }}
                      >
                        ({flight?.aircraft?.icao || "—"})
                      </span>
                    </div>

                    {/* Altitude, HDG */}
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        marginBottom: 7,
                        fontSize: 15,
                      }}
                    >
                      <div style={{ color: "#660b0b" }}>
                        <b>ALT:</b>{" "}
                        <span style={{ color: "#9b1212" }}>
                          {Math.round(pos.altitude || 0)} ft
                        </span>
                      </div>
                      <div style={{ color: "#660b0b" }}>
                        <b>HDG:</b>{" "}
                        <span style={{ color: "#cc3c3c" }}>
                          {Math.round(pos.heading || 0)}°
                        </span>
                      </div>
                    </div>

                    {/* Route */}
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>
                      <span
                        style={{
                          background: "#fde6e8",
                          color: "#a0272a",
                          borderRadius: 7,
                          padding: "4px 12px",
                          fontSize: 14,
                          userSelect: "text",
                          display: "inline-block",
                        }}
                      >
                        <b>DEP:</b> {flight?.dpt_airport_id || "—"}
                        <span style={{ margin: "0 7px" }}>→</span>
                        <b>ARR:</b> {flight?.arr_airport_id || "—"}
                      </span>
                    </div>

                    {/* Status */}
                    {flight.status_text || flight.status ? (
                      <div
                        style={{ marginTop: 10, textAlign: "center" }}
                        aria-label="Flight status"
                      >
                        <span
                          style={{
                            background: "#fbe6e9",
                            color: "#b60c18",
                            borderRadius: 7,
                            padding: "4px 14px",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            userSelect: "text",
                          }}
                        >
                          {flight.status_text || flight.status}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
