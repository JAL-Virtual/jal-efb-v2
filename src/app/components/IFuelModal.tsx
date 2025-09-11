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
      <div className="max-w-xl mx-auto bg-gray-900 text-white p-8 rounded-2xl shadow-2xl border-2 border-[#b60c18]">
        <h2 className="text-2xl font-bold mb-6 text-[#b60c18] tracking-wide text-center">
          FUEL REQUEST AT RAMP
        </h2>
        <div className="grid grid-cols-2 gap-5 mb-6">
          <label className="text-sm col-span-2">Callsign</label>
          <input
            className="col-span-2 w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            value={fields.callsign}
            onChange={e => setFields(f => ({ ...f, callsign: e.target.value }))}
          />

          <label className="text-sm">Departure</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            value={fields.dep}
            onChange={e => setFields(f => ({ ...f, dep: e.target.value.toUpperCase() }))}
            maxLength={4}
          />
          <label className="text-sm">Arrival</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            value={fields.arr}
            onChange={e => setFields(f => ({ ...f, arr: e.target.value.toUpperCase() }))}
            maxLength={4}
          />

          <label className="text-sm">ETOW (KG)</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            type="number"
            min={0}
            value={fields.etow}
            onChange={e => setFields(f => ({ ...f, etow: e.target.value }))}
          />
          <label className="text-sm">MTOW (KG)</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            type="number"
            min={0}
            value={fields.mtow}
            onChange={e => setFields(f => ({ ...f, mtow: e.target.value }))}
          />

          <label className="text-sm">MIN FUEL (KG)</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            type="number"
            min={0}
            value={fields.minFuel}
            onChange={e => setFields(f => ({ ...f, minFuel: e.target.value }))}
          />
          <label className="text-sm">EXTRA FUEL (KG)</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            type="number"
            min={0}
            value={fields.extraFuel}
            onChange={e => setFields(f => ({ ...f, extraFuel: e.target.value }))}
          />

          <label className="text-sm">TOTAL FUEL (KG)</label>
          <input
            className="w-full p-2 border-2 border-[#b60c18] rounded bg-gray-800 font-mono text-white"
            value={totalFuel.toString()}
            readOnly
          />

          <label className="text-sm col-span-2">FUEL TYPE</label>
          <div className="col-span-2 flex gap-4">
            <button
              type="button"
              onClick={() => handleFuelType('JET A1')}
              className={`flex-1 py-2 rounded-lg font-semibold border-2 transition text-lg ${
                fields.fuelType === 'JET A1'
                  ? 'bg-[#b60c18] text-white border-[#b60c18]'
                  : 'bg-gray-800 text-white border-[#b60c18]/60'
              }`}
            >
              JET A1
            </button>
            <button
              type="button"
              onClick={() => handleFuelType('SAF')}
              className={`flex-1 py-2 rounded-lg font-semibold border-2 transition text-lg ${
                fields.fuelType === 'SAF'
                  ? 'bg-[#b60c18] text-white border-[#b60c18]'
                  : 'bg-gray-800 text-white border-[#b60c18]/60'
              }`}
            >
              SAF
            </button>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isSending}
          className="w-full py-3 rounded-lg font-semibold shadow-md bg-gradient-to-r from-[#b60c18] to-[#ea4256] text-white hover:scale-105 transition text-lg"
        >
          {isSending ? "Sending..." : "CONFIRM FUEL"}
        </button>
        {feedback && <p className="mt-4 text-center text-[#b60c18] font-bold">{feedback}</p>}
      </div>
    </Modal>
  );
}
