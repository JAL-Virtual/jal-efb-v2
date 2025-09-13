'use client';
import React from "react";

// Sakura color variations
const petalColors = [
  "#f8c3cd", "#f6ccd7", "#f6b7c7", "#fce4ec", "#ffd1dc"
];

export default function SakuraPetals() {
  const petals = Array.from({ length: 16 }, (_, i) => {
    const scale = 0.5 + Math.random() * 0.7;
    const sway = 20 + Math.random() * 40; // px amplitude for sway
    const z = Math.round(1 + Math.random() * 2);
    const pathIdx = Math.floor(Math.random() * 3);
    return {
      left: `${6 + Math.random() * 86}%`,
      delay: `${Math.random() * 12}s`,
      duration: `${12 + Math.random() * 10}s`,
      opacity: 0.24 + Math.random() * 0.22,
      scale,
      rotate: `${-40 + Math.random() * 80}deg`,
      sway,
      zIndex: z,
      color: petalColors[Math.floor(Math.random() * petalColors.length)],
      pathIdx,
    };
  });

  // Different sakura paths for realism
  const paths = [
    // Classic
    "M24 11C19.42 1.85 7.19 7.17 9.66 18.47C11.65 27.42 20.57 26.9 24 36.33C27.43 26.9 36.35 27.42 38.34 18.47C40.81 7.17 28.58 1.85 24 11Z",
    // Wide
    "M24 10C20 2 6 8 10 19C13 28 20 27 24 36C28 27 35 28 38 19C42 8 28 2 24 10Z",
    // Pointed
    "M24 12C18 0 8 8 12 20C15 28 20 26 24 36C28 26 33 28 36 20C40 8 30 0 24 12Z"
  ];

  return (
    <>
      {petals.map((p, i) => (
        <svg
          key={i}
          style={{
            position: "absolute",
            left: p.left,
            top: -60,
            width: 32 * p.scale,
            height: 32 * p.scale,
            opacity: p.opacity,
            zIndex: p.zIndex,
            pointerEvents: "none",
            filter: `blur(${p.zIndex === 1 ? 0.5 : 0}px)`,
            transform: `rotate(${p.rotate}) scale(${p.scale})`,
            animation: `sakura-fall-adv ${p.duration} linear ${p.delay} infinite, sakura-sway-${i} ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
          viewBox="0 0 48 48"
        >
          <path
            d={paths[p.pathIdx]}
            fill={p.color}
            stroke="#b60c18"
            strokeWidth="1.2"
            style={{
              animation: `sakura-spin ${(parseFloat(p.duration)/2).toFixed(1)}s linear ${p.delay} infinite`
            }}
          />
        </svg>
      ))}
      {/* Animations */}
      <style jsx global>{`
        @keyframes sakura-fall-adv {
          0% { top: -60px; }
          100% { top: 105vh; }
        }
        ${petals.map((p, i) => `
          @keyframes sakura-sway-${i} {
            0%   { transform: translateX(0px);}
            20%  { transform: translateX(-${p.sway/2}px);}
            40%  { transform: translateX(${p.sway}px);}
            60%  { transform: translateX(-${p.sway}px);}
            80%  { transform: translateX(${p.sway/1.6}px);}
            100% { transform: translateX(0px);}
          }
        `).join("\n")}
        @keyframes sakura-spin {
          0%   { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </>
  );
}
