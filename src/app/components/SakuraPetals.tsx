'use client';
import React, { useMemo } from "react";

// Enhanced sakura color variations with gradients
const petalColors = [
  "#f8c3cd", "#f6ccd7", "#f6b7c7", "#fce4ec", "#ffd1dc",
  "#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff"
];

// Enhanced sakura paths for more variety and beauty
const paths = [
  // Classic elegant
  "M24 11C19.42 1.85 7.19 7.17 9.66 18.47C11.65 27.42 20.57 26.9 24 36.33C27.43 26.9 36.35 27.42 38.34 18.47C40.81 7.17 28.58 1.85 24 11Z",
  // Wide graceful
  "M24 10C20 2 6 8 10 19C13 28 20 27 24 36C28 27 35 28 38 19C42 8 28 2 24 10Z",
  // Pointed delicate
  "M24 12C18 0 8 8 12 20C15 28 20 26 24 36C28 26 33 28 36 20C40 8 30 0 24 12Z",
  // Heart-shaped romantic
  "M24 8C20 0 8 6 12 18C15 26 20 24 24 34C28 24 33 26 36 18C40 6 28 0 24 8Z",
  // Star-like magical
  "M24 6C18 0 6 8 10 20C13 28 20 26 24 36C28 26 35 28 38 20C42 8 30 0 24 6Z"
];

export default function SakuraPetals() {
  // Memoize petals for performance
  const petals = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const scale = 0.4 + Math.random() * 0.8;
    const sway = 15 + Math.random() * 50;
    const z = Math.round(1 + Math.random() * 3);
    const pathIdx = Math.floor(Math.random() * paths.length);
    const colorIdx = Math.floor(Math.random() * petalColors.length);
    
    return {
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${15 + Math.random() * 12}s`,
      opacity: 0.2 + Math.random() * 0.3,
      scale,
      rotate: `${-60 + Math.random() * 120}deg`,
      sway,
      zIndex: z,
      color: petalColors[colorIdx],
      pathIdx,
      // Enhanced effects
      shimmer: Math.random() > 0.7,
      glow: Math.random() > 0.8,
      sparkle: Math.random() > 0.9,
      trail: Math.random() > 0.6,
      pulse: Math.random() > 0.5,
      rainbow: Math.random() > 0.95,
    };
  }), []);

  // Add floating sparkles
  const sparkles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: `sparkle-${i}`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 4}s`,
    size: 2 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.4,
  })), []);

  return (
    <>
      {/* Background gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 218, 185, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(255, 192, 203, 0.06) 0%, transparent 50%)
          `,
          animation: 'background-shift 20s ease-in-out infinite',
          zIndex: 0
        }}
      />

      {/* Floating sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            left: s.left,
            top: `${Math.random() * 100}vh`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            zIndex: 10,
            animation: `
              sparkle-float-${s.id} ${s.duration} ease-in-out ${s.delay} infinite,
              sparkle-twinkle-${s.id} 2s ease-in-out ${s.delay} infinite
            `,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 182, 193, 0.6) 50%, transparent 100%)',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
      ))}

      {/* Enhanced Sakura Petals */}
      {petals.map((p) => (
        <svg
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: -80,
            width: 36 * p.scale,
            height: 36 * p.scale,
            opacity: p.opacity,
            zIndex: p.zIndex,
            pointerEvents: "none",
            filter: `
              blur(${p.zIndex === 1 ? 0.8 : p.zIndex === 2 ? 0.4 : 0}px)
              ${p.glow ? 'drop-shadow(0 0 12px rgba(255, 182, 193, 0.8))' : ''}
              ${p.sparkle ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))' : ''}
            `,
            transform: `rotate(${p.rotate}) scale(${p.scale})`,
            animation: `
              sakura-fall-adv ${p.duration} linear ${p.delay} infinite,
              sakura-sway-${p.id} ${p.duration} ease-in-out ${p.delay} infinite
              ${p.shimmer ? `, sakura-shimmer-${p.id} 3s ease-in-out ${p.delay} infinite` : ''}
              ${p.pulse ? `, sakura-pulse-${p.id} 4s ease-in-out ${p.delay} infinite` : ''}
              ${p.trail ? `, sakura-trail-${p.id} ${p.duration} linear ${p.delay} infinite` : ''}
            `,
            willChange: 'transform, opacity',
          }}
          viewBox="0 0 48 48"
        >
          <defs>
            <linearGradient id={`gradient-${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={p.color} stopOpacity="0.9" />
              <stop offset="50%" stopColor={p.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={p.color} stopOpacity="0.5" />
            </linearGradient>
            
            {p.shimmer && (
              <linearGradient id={`shimmer-${p.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" stopOpacity="0" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity="1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
            )}
            
            {p.rainbow && (
              <linearGradient id={`rainbow-${p.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#c44569" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#f8b500" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#ff9ff3" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#54a0ff" stopOpacity="0.8" />
              </linearGradient>
            )}
            
            {p.trail && (
              <filter id={`trail-${p.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="alpha"/>
                <feComposite in="blur" in2="alpha" operator="in"/>
              </filter>
            )}
          </defs>
          <path
            d={paths[p.pathIdx]}
            fill={p.rainbow ? `url(#rainbow-${p.id})` : `url(#gradient-${p.id})`}
            stroke="#b60c18"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            filter={p.trail ? `url(#trail-${p.id})` : 'none'}
            style={{
              animation: `sakura-spin ${(parseFloat(p.duration)/2).toFixed(1)}s linear ${p.delay} infinite`,
            }}
          />
          
          {p.shimmer && (
            <path
              d={paths[p.pathIdx]}
              fill={`url(#shimmer-${p.id})`}
              opacity="0.3"
              style={{
                animation: `sakura-shimmer-${p.id} 2s ease-in-out ${p.delay} infinite`
              }}
            />
          )}
          
          {p.sparkle && (
            <circle
              cx="24"
              cy="24"
              r="2"
              fill="rgba(255, 255, 255, 0.9)"
              style={{
                animation: `sparkle-glow-${p.id} 1.5s ease-in-out ${p.delay} infinite`
              }}
            />
          )}
        </svg>
      ))}
      {/* Enhanced Animations */}
      <style jsx global>{`
        /* Background gradient animation */
        @keyframes background-shift {
          0% { 
            background-position: 0% 0%, 100% 100%, 50% 50%;
          }
          50% { 
            background-position: 100% 100%, 0% 0%, 25% 75%;
          }
          100% { 
            background-position: 0% 0%, 100% 100%, 50% 50%;
          }
        }
        
        @keyframes sakura-fall-adv {
          0% { 
            top: -80px; 
            opacity: 0;
            transform: scale(0.8);
          }
          10% { 
            opacity: 1;
            transform: scale(1);
          }
          90% { 
            opacity: 0.8;
            transform: scale(1.1);
          }
          100% { 
            top: 110vh; 
            opacity: 0;
            transform: scale(0.6);
          }
        }
        
        ${petals.map((p) => `
          @keyframes sakura-sway-${p.id} {
            0%   { transform: translateX(0px) translateY(0px);}
            15%  { transform: translateX(-${p.sway/3}px) translateY(2px);}
            30%  { transform: translateX(${p.sway/2}px) translateY(-1px);}
            45%  { transform: translateX(-${p.sway}px) translateY(3px);}
            60%  { transform: translateX(${p.sway/1.5}px) translateY(-2px);}
            75%  { transform: translateX(-${p.sway/2}px) translateY(1px);}
            90%  { transform: translateX(${p.sway/3}px) translateY(-1px);}
            100% { transform: translateX(0px) translateY(0px);}
          }
          
          ${p.shimmer ? `
          @keyframes sakura-shimmer-${p.id} {
            0%   { opacity: 0; transform: translateX(-100%);}
            50%  { opacity: 1; transform: translateX(0%);}
            100% { opacity: 0; transform: translateX(100%);}
          }
          ` : ''}
          
          ${p.pulse ? `
          @keyframes sakura-pulse-${p.id} {
            0%   { opacity: 0.2; transform: scale(1);}
            50%  { opacity: 0.6; transform: scale(1.1);}
            100% { opacity: 0.2; transform: scale(1);}
          }
          ` : ''}
          
          ${p.trail ? `
          @keyframes sakura-trail-${p.id} {
            0%   { filter: url(#trail-${p.id}) opacity(0);}
            20%  { filter: url(#trail-${p.id}) opacity(0.3);}
            80%  { filter: url(#trail-${p.id}) opacity(0.3);}
            100% { filter: url(#trail-${p.id}) opacity(0);}
          }
          ` : ''}
          
          ${p.sparkle ? `
          @keyframes sparkle-glow-${p.id} {
            0%   { opacity: 0; transform: scale(0.5);}
            50%  { opacity: 1; transform: scale(1.2);}
            100% { opacity: 0; transform: scale(0.5);}
          }
          ` : ''}
        `).join("\n")}
        
        ${sparkles.map((s) => `
          @keyframes sparkle-float-${s.id} {
            0%   { transform: translateY(0px) translateX(0px); opacity: 0;}
            20%  { transform: translateY(-20px) translateX(10px); opacity: 1;}
            40%  { transform: translateY(-40px) translateX(-5px); opacity: 0.8;}
            60%  { transform: translateY(-60px) translateX(15px); opacity: 1;}
            80%  { transform: translateY(-80px) translateX(-10px); opacity: 0.6;}
            100% { transform: translateY(-100px) translateX(0px); opacity: 0;}
          }
          
          @keyframes sparkle-twinkle-${s.id} {
            0%   { opacity: 0.3; transform: scale(1);}
            50%  { opacity: 1; transform: scale(1.5);}
            100% { opacity: 0.3; transform: scale(1);}
          }
        `).join("\n")}
        
        @keyframes sakura-spin {
          0%   { transform: rotate(0deg);}
          25%  { transform: rotate(90deg);}
          50%  { transform: rotate(180deg);}
          75%  { transform: rotate(270deg);}
          100% { transform: rotate(360deg);}
        }
        
        /* Performance optimizations */
        .sakura-petal {
          will-change: transform, opacity;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .sakura-petal {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </>
  );
}
