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
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b60c18] to-[#ea4256]"></div>
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#b60c18] opacity-20 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#ea4256] opacity-20 rounded-full"></div>
        
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-[#b60c18] to-[#ea4256] bg-clip-text text-transparent">
          FUEL REQUEST
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">AT RAMP - JAL VIRTUAL</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 relative z-10">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Callsign</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all"
              placeholder="e.g. JL123"
              value={fields.callsign}
              onChange={e => setFields(f => ({ ...f, callsign: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Departure</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all uppercase"
              placeholder="ICAO"
              value={fields.dep}
              onChange={e => setFields(f => ({ ...f, dep: e.target.value.toUpperCase() }))}
              maxLength={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Arrival</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all uppercase"
              placeholder="ICAO"
              value={fields.arr}
              onChange={e => setFields(f => ({ ...f, arr: e.target.value.toUpperCase() }))}
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ETOW (KG)</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all"
              type="number"
              min={0}
              placeholder="Estimated TOW"
              value={fields.etow}
              onChange={e => setFields(f => ({ ...f, etow: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">MTOW (KG)</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all"
              type="number"
              min={0}
              placeholder="Max TOW"
              value={fields.mtow}
              onChange={e => setFields(f => ({ ...f, mtow: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">MIN FUEL (KG)</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all"
              type="number"
              min={0}
              placeholder="Minimum required"
              value={fields.minFuel}
              onChange={e => setFields(f => ({ ...f, minFuel: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">EXTRA FUEL (KG)</label>
            <input
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all"
              type="number"
              min={0}
              placeholder="Additional fuel"
              value={fields.extraFuel}
              onChange={e => setFields(f => ({ ...f, extraFuel: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">TOTAL FUEL (KG)</label>
            <div className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/40 backdrop-blur-sm text-white font-mono text-lg">
              {totalFuel.toLocaleString()} KG
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">FUEL TYPE</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleFuelType('JET A1')}
                className={`flex-1 py-3 rounded-lg font-semibold border transition-all ${
                  fields.fuelType === 'JET A1'
                    ? 'bg-gradient-to-r from-[#b60c18] to-[#d63c4c] text-white border-[#b60c18] shadow-lg shadow-[#b60c18]/30'
                    : 'bg-gray-800/70 text-gray-300 border-gray-600 hover:bg-gray-700/50'
                }`}
              >
                JET A1
              </button>
              <button
                type="button"
                onClick={() => handleFuelType('SAF')}
                className={`flex-1 py-3 rounded-lg font-semibold border transition-all ${
                  fields.fuelType === 'SAF'
                    ? 'bg-gradient-to-r from-[#0cb654] to-[#2dd673] text-white border-[#0cb654] shadow-lg shadow-[#0cb654]/30'
                    : 'bg-gray-800/70 text-gray-300 border-gray-600 hover:bg-gray-700/50'
                }`}
              >
                SUSTAINABLE AVIATION FUEL
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 relative z-10">
          <button
            onClick={handleConfirm}
            disabled={isSending}
            className="w-full py-3.5 rounded-lg font-semibold shadow-lg bg-gradient-to-r from-[#b60c18] to-[#ea4256] text-white hover:shadow-xl hover:from-[#c21c28] hover:to-[#ea5266] transition-all duration-300 transform hover:-translate-y-0.5 text-lg flex items-center justify-center"
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                SENDING REQUEST...
              </>
            ) : (
              'CONFIRM FUEL REQUEST'
            )}
          </button>
          
          {feedback && (
            <div className={`p-3 rounded-lg text-center font-medium ${
              feedback.includes("✅") 
                ? "bg-green-900/30 text-green-400 border border-green-800/50" 
                : "bg-red-900/30 text-red-400 border border-red-800/50"
            }`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}