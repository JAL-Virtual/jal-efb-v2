'use client';
import React, { ReactNode, useEffect } from "react";

export default function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Enhanced modal container */}
      <div
        className={`
          relative bg-gradient-to-br from-white/98 via-white/95 to-white/98 
          border-2 border-[#b60c18]/30 rounded-3xl shadow-2xl 
          px-8 pt-16 pb-8 max-w-6xl w-full animate-modalSlideIn
          max-h-[90vh] overflow-y-auto backdrop-blur-xl
          ${wide ? "max-w-7xl" : ""}
        `}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#b60c18] via-[#ea4256] to-[#b60c18] rounded-t-3xl"></div>
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#b60c18]/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#ea4256]/20 rounded-full blur-xl"></div>
        
        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-6 z-20 px-4 py-2 rounded-full bg-gradient-to-r from-[#b60c18] to-[#ea4256] hover:from-[#ea4256] hover:to-[#b60c18] text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#b60c18]/60 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          aria-label="Close"
          type="button"
        >
          ✕ Close
        </button>
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-modalSlideIn {
          animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
