"use client";

import { useMemo } from "react";

export default function FloatingCranes() {
  // Number of cranes
  const count = 6;

  const cranes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${18 + Math.random() * 10}s`,
        size: 40 + Math.random() * 30,
        rotate: Math.random() * 20 - 10, // tilt left or right
      })),
    [count]
  );

  return (
    <>
      {cranes.map((c, i) => (
        <svg
          key={i}
          width={c.size}
          height={c.size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: "absolute",
            left: c.left,
            top: "-60px",
            pointerEvents: "none",
            animation: `crane-float ${c.duration} linear ${c.delay} infinite`,
            transform: `rotate(${c.rotate}deg)`,
            opacity: 0.9,
          }}
        >
          {/* Simplified origami crane shape */}
          <path
            d="M32 2 L38 24 L62 32 L38 40 L32 62 L26 40 L2 32 L26 24 Z"
            fill="#ffffff"
            stroke="#b60c18"
            strokeWidth="2"
          />
          <style>{`
            @keyframes crane-float {
              0%   { transform: translateY(0) scale(1) rotate(${c.rotate}deg); opacity: 0; }
              10%  { opacity: 1; }
              50%  { transform: translateY(50vh) scale(1.05) rotate(${c.rotate}deg); }
              100% { transform: translateY(110vh) scale(1) rotate(${c.rotate}deg); opacity: 0; }
            }
          `}</style>
        </svg>
      ))}
    </>
  );
}
