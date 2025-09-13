"use client";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function MapPage() {
  return (
    <>
      <div className="relative min-h-screen">
        <MapComponent />
        {/* Footer fixed at bottom */}
        <footer className="fixed bottom-0 left-0 w-full py-3 flex flex-col items-center bg-white/85 backdrop-blur-sm font-semibold text-sm tracking-wide border-t border-[#b60c18]/20 z-30 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="text-[#b60c18] font-semibold tracking-widest">© {new Date().getFullYear()} JAPAN AIRLINES VIRTUAL</span>
            <span className="text-[#ea4256] animate-pulse select-none">✈️</span>
          </div>
        </footer>
      </div>
    </>
  );
}
