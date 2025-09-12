'use client';
export default function AnimatedModalBg() {
  return (
    <svg className="absolute left-0 top-0 w-full h-full opacity-15 z-0 pointer-events-none" viewBox="0 0 400 180" fill="none">
      <path d="M0,80 Q70,100 200,90 T400,70 L400,180 L0,180 Z" fill="#b60c18" />
      <ellipse cx="90" cy="42" rx="50" ry="22" fill="#ea4256" opacity="0.32" />
      <ellipse cx="320" cy="90" rx="40" ry="16" fill="#f8c3cd" opacity="0.33" />
    </svg>
  );
}
