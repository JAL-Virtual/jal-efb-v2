'use client';
import React, { ReactNode } from "react";
import { Icon } from "@iconify/react";

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
          px-6 py-6 max-w-5xl w-full animate-fadein 
          max-h-screen overflow-y-auto 
          ${wide ? "max-w-52xl" : ""}
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-[#b60c18] hover:text-[#ea4256] text-2xl"
        >
          <Icon icon="mdi:close-circle" />
        </button>
        {children}
      </div>
    </div>
  );
}
