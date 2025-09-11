'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

type FlightInfo = {
  dpt?: string;
  arr?: string;
};

type LandingPageProps = {
  onEnter: () => void;
  flight?: FlightInfo; // optional
};

export default function LandingPage({ onEnter, flight }: LandingPageProps) {
  const [shake, setShake] = useState(false);

  // Safe fallback if no flight is passed
  const safeFlight = flight || { dpt: '-', arr: '-' };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      {/* Background Image */}
      <Image
        src="/Images/ife-galaxy.jpg"   // ✅ now points to /public/Images/
        alt="IFE Background"
        fill
        priority
        style={{ objectFit: 'cover' }}
        className="pointer-events-none select-none"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-2xl font-semibold mb-2">Welcome On Board</h1>
        <div className="mb-6">
          <h2 className="text-4xl font-extrabold tracking-tight">
            {safeFlight.dpt}{' '}
            <span className="inline-block rotate-90">✈️</span>{' '}
            {safeFlight.arr}
          </h2>
        </div>

        {/* Start Button */}
        <motion.button
          type="button"
          onClick={onEnter}
          animate={shake ? { x: [-6, 6, -4, 4, 0] } : {}}
          className="px-8 py-3 rounded-full bg-gradient-to-b from-red-600 to-red-500 text-white font-semibold shadow-xl hover:shadow-2xl transition-all"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          スタート / Start
        </motion.button>

        <p className="text-xs text-gray-300 mt-3">
          Use a mouse to start (touch/keyboard disabled)
        </p>
      </div>
    </div>
  );
}
