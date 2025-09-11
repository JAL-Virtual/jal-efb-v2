'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';
import { Icon } from '@iconify/react';

const WEBHOOK_URL = "https://discord.com/api/webhooks/1390281109862092913/fYdJLjqYavUblunHHeGFgtx3vShJN44nh8BJMVf_2egEV6vmdxCPY94lr_L_Xa0rf0xJ";

const DELAY_CODES = [
  { code: "58", reason: "SIM FAILURE" },
  { code: "59", reason: "WASM CRASH" },
  { code: "15", reason: "LATE LANDING" },
  { code: "83", reason: "ATC CAPACITY AT DEPARTURE" },
  { code: "84", reason: "ATC CAPACITY AT ARRIVAL" },
  { code: "16", reason: "LATE BOARDING" },
  { code: "07", reason: "SLOW BOARDING OF PREVIOUS FLIGHT" },
  { code: "08", reason: "SLOW DEBOARDING OF PREVIOUS FLIGHT" },
  { code: "00", reason: "PILOT DECISION TO DELAY FLIGHT" },
  { code: "49", reason: "APU INOP" },
  { code: "50", reason: "ENGINE FAILURES" },
  { code: "09", reason: "INSUFFICIENT GROUND TIME" },
  { code: "85", reason: "WRONG DISPATCHING" },
  { code: "36", reason: "LATE REQ OF REFUELING" },
  { code: "22", reason: "LATE LOADING OF CARGO" },
  { code: "23", reason: "LATE LOADING OF MAIL" },
  { code: "24", reason: "LATE LOADING OF BAGS" },
  { code: "01", reason: "PILOT ERROR DUING BOOKING PROCESS" },
  { code: "62", reason: "MORE FUEL NEEDED" },
  { code: "64", reason: "PILOT SICKNESS" },
  { code: "52", reason: "DAMAGE WHILE GROUNDED" },
  { code: "71", reason: "DEPARTURE AIRPORT WEATHER RESTRICTIONS" },
  { code: "72", reason: "ARRIVAL AIRPORT WEATHER RESTRICTIONS" },
  { code: "96", reason: "FLIGHT CANCELLED" },
];

type Props = {
  show: boolean;
  onClose: () => void;
};

export default function DelayCodeModal({ show, onClose }: Props) {
  const [jalId, setJalId] = useState("");
  const [selectedCode, setSelectedCode] = useState(DELAY_CODES[0].code);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string, success: boolean } | null>(null);

  // Reset fields on show
  useEffect(() => {
    if (show) {
      setJalId("");
      setSelectedCode(DELAY_CODES[0].code);
      setToast(null);
      setIsSending(false);
    }
  }, [show]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const handleSend = async () => {
    setIsSending(true);
    setToast(null);

    const selected = DELAY_CODES.find(d => d.code === selectedCode);

    const embedContent = {
      embeds: [
        {
          title: "DELAY CODE REPORT",
          color: 0xffcb05,
          fields: [
            { name: "DELAY CODE", value: `${selected?.code} - ${selected?.reason}`, inline: false },
            { name: "PIC ID", value: jalId || '-', inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "JALv EFB - Delay Code System" }
        }
      ]
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedContent),
      });
      if (res.ok) {
        setToast({ message: "✅ Successfully submitted!", success: true });
      } else {
        setToast({ message: "❌ Failed to submit. Try again.", success: false });
      }
    } catch {
      setToast({ message: "❌ Failed to submit. Try again.", success: false });
    }
    setIsSending(false);
  };

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-6 right-7 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-semibold text-lg transition-all duration-300
            ${toast.success
              ? "bg-[#282f0a]/95 text-[#ffe164] border border-[#ffcb05] shadow-yellow-400/50"
              : "bg-[#2b181a]/95 text-[#ff4f4f] border border-[#f77] shadow-red-500/30"}
          `}
          style={{
            minWidth: 220,
            maxWidth: 340,
            animation: "fadeInUp 0.3s cubic-bezier(.24,1.44,.56,1)",
          }}
        >
          <Icon icon={toast.success ? "mdi:check-circle" : "mdi:alert-circle"} className="text-2xl" />
          <span className="whitespace-pre-line">{toast.message}</span>
        </div>
      )}

      <div
        className="max-w-md mx-auto rounded-2xl shadow-2xl p-7"
        style={{
          background: "linear-gradient(135deg,#16181b 75%,#22262e 100%)",
          boxShadow: "0 8px 48px 0 rgba(0,0,0,0.75)"
        }}
      >
        <div className="flex items-center justify-center mb-4">
          <Icon icon="mdi:alert" className="text-3xl mr-2 text-[#ffcb05]" />
          <h2 className="text-2xl font-extrabold tracking-wide text-white text-center">Delay Code Report</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 mb-6">
          <div>
            <label className="text-xs text-[#ffcb05] font-bold mb-1 block tracking-wide">JAL ID - NAME</label>
            <input
              className="w-full p-3 border border-[#ffcb05] rounded-lg bg-[#18191b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffcb05] transition"
              value={jalId}
              onChange={e => setJalId(e.target.value)}
              placeholder="Enter your JAL ID and Name"
              disabled={isSending}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[#ffcb05] font-bold mb-1 block tracking-wide">Delay Code</label>
            <select
              className="w-full p-3 border border-[#ffcb05] rounded-lg bg-[#18191b] text-white focus:outline-none focus:ring-2 focus:ring-[#ffcb05] transition"
              value={selectedCode}
              onChange={e => setSelectedCode(e.target.value)}
              disabled={isSending}
            >
              {DELAY_CODES.map(dc => (
                <option key={dc.code} value={dc.code}>{dc.code} - {dc.reason}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="w-full py-3 rounded-xl font-bold shadow bg-gradient-to-r from-[#ffcb05] to-[#ffc928] text-[#18191b] hover:scale-105 hover:from-[#ffe564] hover:to-[#ffd700] transition text-lg mb-2 uppercase tracking-wide"
          onClick={handleSend}
          disabled={isSending || !jalId.trim()}
        >
          {isSending ? (
            <span className="flex items-center justify-center gap-2">
              <Icon icon="line-md:loading-twotone-loop" className="text-xl animate-spin" />
              Sending...
            </span>
          ) : (
            <span>
              <Icon icon="mdi:send" className="inline mr-2 text-[#18191b] text-lg align-middle" />
              Send Delay Code
            </span>
          )}
        </button>
        <div className="mt-6 text-xs text-center text-gray-400">JALv EFB • Delay Code System</div>
      </div>

      {/* CSS keyframes for fadeInUp */}
      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(32px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Modal>
  );
}
