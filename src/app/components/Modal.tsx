'use client';
import React, { ReactNode } from "react";

export default function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`
          relative bg-white/95 border-2 border-[#b60c18]/25 rounded-3xl shadow-2xl 
          px-6 pt-12 pb-6 max-w-5xl w-full animate-fadein 
          max-h-screen overflow-y-auto 
          ${wide ? "max-w-52xl" : ""}
        `}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-20 px-3 py-1.5 rounded-full bg-[#b60c18] hover:bg-[#ea4256] text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400/60"
          aria-label="Close"
          type="button"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
