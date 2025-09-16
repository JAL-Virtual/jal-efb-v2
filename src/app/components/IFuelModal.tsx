'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1390337267268194374/qouGN0yKpcTbvMxfVFebK9hLTz32mUYFtft2-PLzfqfTstvQGsHWw2aYbcOY3hgnN8Bz";

type Props = {
  show: boolean;
  onClose: () => void;
  dpt?: string;
  arr?: string;
  initialFields?: Partial<FuelFields>;
  onConfirm: any;
};

type FuelFields = {
  callsign: string;
  dep: string;
  arr: string;
  etow: string;
  mtow: string;
  minFuel: string;
  extraFuel: string;
  totalFuel: string;
  fuelType: 'JET A1' | 'SAF';
};

export default function IFuelModal({
  show,
  onClose,
  dpt = '',
  arr = '',
  initialFields = {},
  onConfirm
}: Props) {
  const [fields, setFields] = useState<FuelFields>({
    callsign: "",
    dep: dpt,
    arr: arr,
    etow: "",
    mtow: "",
    minFuel: "",
    extraFuel: "",
    totalFuel: "",
    fuelType: "JET A1",
    ...initialFields,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // auto‐calc total
  const totalFuel = (Number(fields.minFuel) || 0) + (Number(fields.extraFuel) || 0);

  useEffect(() => {
    setFields(f => ({
      ...f,
      dep: dpt,
      arr,
      totalFuel: totalFuel.toString(),
      ...initialFields,
    }));
    setFeedback(null);
  }, [show, dpt, arr, initialFields]);

  const handleFuelType = (type: 'JET A1' | 'SAF') => {
    setFields(f => ({ ...f, fuelType: type }));
  };

  async function handleConfirm() {
    setIsSending(true);
    setFeedback(null);

    const embedContent = {
      embeds: [{
        title: "FUEL REQUEST AT RAMP",
        color: 0xb60c18,
        fields: [
          { name: "Callsign", value: fields.callsign || "-", inline: true },
          { name: "Departure", value: fields.dep || "-", inline: true },
          { name: "Arrival", value: fields.arr || "-", inline: true },
          { name: "ETOW (KG)", value: fields.etow || "-", inline: true },
          { name: "MTOW (KG)", value: fields.mtow || "-", inline: true },
          { name: "MIN FUEL (KG)", value: fields.minFuel || "-", inline: true },
          { name: "EXTRA FUEL (KG)", value: fields.extraFuel || "-", inline: true },
          { name: "TOTAL FUEL (KG)", value: totalFuel.toString(), inline: true },
          { name: "FUEL TYPE", value: fields.fuelType, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "JALv EFB - Auto Fuel Dispatch" },
      }]
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedContent),
      });
      setFeedback(res.ok ? "✅ Fuel request sent!" : "❌ Failed to send request.");
    } catch {
      setFeedback("❌ Failed to send request.");
    }

    setIsSending(false);
    onConfirm?.();
  }

  if (!show) return null;
  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white p-10 rounded-3xl shadow-2xl border border-gray-600/50 relative overflow-hidden backdrop-blur-xl">
        {/* Enhanced Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#b60c18] via-[#ea4256] to-[#b60c18] animate-pulse"></div>
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#b60c18]/30 to-[#ea4256]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-gradient-to-tr from-[#ea4256]/30 to-[#b60c18]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-[#b60c18]/10 to-[#ea4256]/10 rounded-full blur-2xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-[#b60c18] via-[#ea4256] to-[#b60c18] bg-clip-text text-transparent animate-pulse">
            ⛽ FUEL REQUEST
          </h2>
          <p className="text-gray-300 text-lg font-medium">AT RAMP - JAL VIRTUAL</p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#b60c18] to-[#ea4256] mx-auto mt-3 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#b60c18] rounded-full"></span>
              Callsign
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18]/50 focus:border-[#b60c18] transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium"
              placeholder="e.g. JL123"
              value={fields.callsign}
              onChange={e => setFields(f => ({ ...f, callsign: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ea4256] rounded-full"></span>
              Departure
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#ea4256]/50 focus:border-[#ea4256] transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium uppercase"
              placeholder="ICAO"
              value={fields.dep}
              onChange={e => setFields(f => ({ ...f, dep: e.target.value.toUpperCase() }))}
              maxLength={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ea4256] rounded-full"></span>
              Arrival
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#ea4256]/50 focus:border-[#ea4256] transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium uppercase"
              placeholder="ICAO"
              value={fields.arr}
              onChange={e => setFields(f => ({ ...f, arr: e.target.value.toUpperCase() }))}
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              ETOW (KG)
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium"
              type="number"
              min={0}
              placeholder="Estimated TOW"
              value={fields.etow}
              onChange={e => setFields(f => ({ ...f, etow: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              MTOW (KG)
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium"
              type="number"
              min={0}
              placeholder="Max TOW"
              value={fields.mtow}
              onChange={e => setFields(f => ({ ...f, mtow: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              MIN FUEL (KG)
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium"
              type="number"
              min={0}
              placeholder="Minimum required"
              value={fields.minFuel}
              onChange={e => setFields(f => ({ ...f, minFuel: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              EXTRA FUEL (KG)
            </label>
            <input
              className="w-full p-4 border border-gray-500/50 rounded-xl bg-gray-800/80 backdrop-blur-sm text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 hover:bg-gray-700/80 text-lg font-medium"
              type="number"
              min={0}
              placeholder="Additional fuel"
              value={fields.extraFuel}
              onChange={e => setFields(f => ({ ...f, extraFuel: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              TOTAL FUEL (KG)
            </label>
            <div className="w-full p-5 border-2 border-yellow-500/50 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm text-white font-mono text-2xl font-bold text-center shadow-lg shadow-yellow-500/20">
              {totalFuel.toLocaleString()} KG
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              FUEL TYPE
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleFuelType('JET A1')}
                className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all duration-300 transform hover:scale-105 ${
                  fields.fuelType === 'JET A1'
                    ? 'bg-gradient-to-r from-[#b60c18] to-[#d63c4c] text-white border-[#b60c18] shadow-xl shadow-[#b60c18]/40 scale-105'
                    : 'bg-gray-800/70 text-gray-300 border-gray-500 hover:bg-gray-700/50 hover:border-gray-400'
                }`}
              >
                ⛽ JET A1
              </button>
              <button
                type="button"
                onClick={() => handleFuelType('SAF')}
                className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all duration-300 transform hover:scale-105 ${
                  fields.fuelType === 'SAF'
                    ? 'bg-gradient-to-r from-[#0cb654] to-[#2dd673] text-white border-[#0cb654] shadow-xl shadow-[#0cb654]/40 scale-105'
                    : 'bg-gray-800/70 text-gray-300 border-gray-500 hover:bg-gray-700/50 hover:border-gray-400'
                }`}
              >
                🌱 SUSTAINABLE AVIATION FUEL
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6 relative z-10">
          <button
            onClick={handleConfirm}
            disabled={isSending}
            className="w-full py-5 rounded-2xl font-black shadow-2xl bg-gradient-to-r from-[#b60c18] via-[#ea4256] to-[#b60c18] text-white hover:shadow-3xl hover:from-[#c21c28] hover:via-[#ea5266] hover:to-[#c21c28] transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 text-xl flex items-center justify-center border-2 border-white/20 backdrop-blur-sm"
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                🚀 SENDING REQUEST...
              </>
            ) : (
              '🚀 CONFIRM FUEL REQUEST'
            )}
          </button>
          
          {feedback && (
            <div className={`p-4 rounded-xl text-center font-bold text-lg border-2 backdrop-blur-sm ${
              feedback.includes("✅") 
                ? "bg-gradient-to-r from-green-900/40 to-green-800/40 text-green-300 border-green-500/50 shadow-lg shadow-green-500/20" 
                : "bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20"
            }`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}