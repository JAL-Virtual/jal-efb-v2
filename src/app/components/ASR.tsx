'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

const WEBHOOK_URL = "https://discord.com/api/webhooks/1390281008758390905/v7rNLeQgMOPXgysRTfsustJVXJGB7JylSBE55ezHTgWv7ajxGeXuc7WvzuBq8jbWHxxX";

const FLIGHT_PHASES = [
  "BOARDING", "TAXI", "TAKEOFF", "CLIMB", "CRUISE", "DECENT", "FINAL", "LANDING", "DEBOARDING"
];
const WEATHER_OPTIONS = [
  "CLEAR", "RAIN", "SNOW", "CLOUDY", "HEAVYTHUNDERSTROME"
];

type Props = {
  show: boolean;
  onClose: () => void;
};

type ASRFields = {
  jalId: string;
  callsign: string;
  date: string;
  time: string;
  location: string;
  acType: string;
  registration: string;
  pob: string;
  flightPhase: string;
  network: string;
  atc: string;
  weather: string;
  narrative: string;
};

const maxWords = 300;

function formatDateToDDMMYYYY(iso: string) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}:${mm}:${yyyy}`;
}
function formatTimeHHMM(val: string) {
  if (!val) return "";
  const [hh, mm] = val.split(":");
  return `${hh}:${mm}`;
}

export default function ASRModal({ show, onClose }: Props) {
  const [fields, setFields] = useState<ASRFields>({
    jalId: '',
    callsign: '',
    date: '',
    time: '',
    location: '',
    acType: '',
    registration: '',
    pob: '',
    flightPhase: FLIGHT_PHASES[0],
    network: '',
    atc: '',
    weather: WEATHER_OPTIONS[0],
    narrative: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [narrativeWords, setNarrativeWords] = useState(0);
  const [rawDate, setRawDate] = useState<string>('');
  const [rawTime, setRawTime] = useState<string>('');

  useEffect(() => {
    if (show) {
      setFields({
        jalId: '',
        callsign: '',
        date: '',
        time: '',
        location: '',
        acType: '',
        registration: '',
        pob: '',
        flightPhase: FLIGHT_PHASES[0],
        network: '',
        atc: '',
        weather: WEATHER_OPTIONS[0],
        narrative: '',
      });
      setRawDate('');
      setRawTime('');
      setFeedback(null);
      setNarrativeWords(0);
      setIsSending(false);
    }
  }, [show]);

  const handleField = (k: keyof ASRFields, v: string) => {
    setFields(f => ({ ...f, [k]: v }));
    if (k === 'narrative') {
      const wordCount = v.trim().split(/\s+/).filter(Boolean).length;
      setNarrativeWords(wordCount);
    }
  };

  useEffect(() => {
    if (rawDate) {
      handleField('date', formatDateToDDMMYYYY(rawDate));
    }
  }, [rawDate]);
  useEffect(() => {
    if (rawTime) {
      handleField('time', formatTimeHHMM(rawTime));
    }
  }, [rawTime]);

  const handleSubmit = async () => {
    setIsSending(true);
    setFeedback(null);

    const embedContent = {
      embeds: [
        {
          title: "AIR SAFETY REPORT (ASR)",
          color: 0xb60c18,
          fields: [
            { name: "JAL ID - Name", value: fields.jalId || '-', inline: true },
            { name: "CALLSIGN", value: fields.callsign || '-', inline: true },
            { name: "TYPE OF EVENT", value: "ASR", inline: true },
            { name: "DATE OF OCCURENCE", value: fields.date || '-', inline: true },
            { name: "TIME REPORT (UTC)", value: fields.time || '-', inline: true },
            { name: "LOCATION (ICAO)", value: fields.location || '-', inline: true },
            { name: "AIRCRAFT TYPE", value: fields.acType || '-', inline: true },
            { name: "REGISTRATION", value: fields.registration || '-', inline: true },
            { name: "POB", value: fields.pob || '-', inline: true },
            { name: "FLIGHT PHASE", value: fields.flightPhase || '-', inline: true },
            { name: "NETWORK", value: fields.network || '-', inline: true },
            { name: "ATC", value: fields.atc || '-', inline: true },
            { name: "WEATHER", value: fields.weather || '-', inline: true },
            { name: "EVENT NARRATIVE", value: fields.narrative || '-', inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "JALv EFB - ASR System" }
        },
      ],
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedContent),
      });
      if (res.ok) setFeedback("✅ Successfully submitted to Operation teams!");
      else setFeedback("❌ Failed to submit. Try again.");
    } catch {
      setFeedback("❌ Failed to submit. Try again.");
    }
    setIsSending(false);
  };

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div
        className="max-w-2xl mx-auto p-8 rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(135deg,#16181b 75%,#23242a 100%)",
        }}
      >
        <h2 className="text-2xl font-bold mb-7 text-[#ffe164] tracking-wide text-center drop-shadow">
          AIR SAFETY REPORT (ASR)
        </h2>
        <div className="grid grid-cols-2 gap-5 mb-6">
          <label className="text-sm col-span-2 text-[#ffe164]">JAL ID - Name</label>
          <input
            className="col-span-2 w-full p-2 border border-[#ffe164]/30 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.jalId}
            onChange={e => handleField('jalId', e.target.value)}
            placeholder="Enter JAL ID and Name"
          />

          <label className="text-sm text-[#ffe164]">Callsign</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.callsign}
            onChange={e => handleField('callsign', e.target.value)}
            placeholder="Flight Callsign"
          />

          <label className="text-sm text-[#ffe164]">Date of Occurrence</label>
          <input
            type="date"
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={rawDate}
            onChange={e => setRawDate(e.target.value)}
            placeholder="YYYY-MM-DD"
          />

          <label className="text-sm text-[#ffe164]">Time Report (UTC)</label>
          <input
            type="time"
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={rawTime}
            onChange={e => setRawTime(e.target.value)}
            placeholder="HH:MM"
          />

          <label className="text-sm text-[#ffe164]">Location (ICAO)</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.location}
            onChange={e => handleField('location', e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="ICAO Code"
          />

          <label className="text-sm text-[#ffe164]">Aircraft Type</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.acType}
            onChange={e => handleField('acType', e.target.value)}
            placeholder="e.g. A359"
          />

          <label className="text-sm text-[#ffe164]">Registration</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.registration}
            onChange={e => handleField('registration', e.target.value)}
            placeholder="e.g. JA01XJ"
          />

          <label className="text-sm text-[#ffe164]">POB</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.pob}
            onChange={e => handleField('pob', e.target.value)}
            type="number"
            min={0}
            placeholder="Total onboard"
          />

          <label className="text-sm text-[#ffe164]">Flight Phase</label>
          <select
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.flightPhase}
            onChange={e => handleField('flightPhase', e.target.value)}
          >
            {FLIGHT_PHASES.map(phase => <option key={phase}>{phase}</option>)}
          </select>

          <label className="text-sm text-[#ffe164]">Network</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.network}
            onChange={e => handleField('network', e.target.value)}
            placeholder="e.g. VATSIM"
          />

          <label className="text-sm text-[#ffe164]">ATC Station - Frequency</label>
          <input
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.atc}
            onChange={e => handleField('atc', e.target.value)}
            placeholder="e.g. RJTT_N_GND 122.075"
          />

          <label className="text-sm text-[#ffe164]">Weather</label>
          <select
            className="w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white focus:ring-2 focus:ring-[#ffe164] outline-none"
            value={fields.weather}
            onChange={e => handleField('weather', e.target.value)}
          >
            {WEATHER_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>

          {/* Event Narrative full width */}
          <label className="text-sm col-span-2 text-[#ffe164]">Event Narrative <span className="text-xs text-gray-400">(max {maxWords} words)</span></label>
          <textarea
            className="col-span-2 w-full p-2 border border-[#ffe164]/20 rounded-lg bg-[#23242a] text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffe164] outline-none min-h-[100px] resize-none"
            value={fields.narrative}
            onChange={e => {
              let val = e.target.value;
              let words = val.trim().split(/\s+/).filter(Boolean);
              if (words.length > maxWords) {
                val = words.slice(0, maxWords).join(' ');
                words = words.slice(0, maxWords);
              }
              handleField('narrative', val);
            }}
            maxLength={3000}
            placeholder="Describe the event in detail..."
          />
          <span className="text-xs text-gray-400 col-span-2 text-right">{narrativeWords}/{maxWords} words</span>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-semibold shadow-md bg-gradient-to-r from-[#ffe164] to-[#b60c18] text-[#18191b] hover:from-[#fff08a] hover:to-[#ea4256] hover:scale-105 transition text-lg mb-2"
          disabled={isSending || narrativeWords === 0}
        >
          {isSending ? "Submitting..." : "Submit Report"}
        </button>
        {feedback && (
          <div className={`mt-2 text-center font-bold ${feedback.startsWith('✅') ? 'text-[#ffe164]' : 'text-[#ff5a5a]'}`}>
            {feedback}
          </div>
        )}
      </div>
    </Modal>
  );
}
