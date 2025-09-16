'use client'
import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { Icon } from "@iconify/react"
import { useLanguage } from '../../lib/LanguageContext'

const AIRLINES = [
  { id: 'JAL', name: 'Japan Airlines' },
  { id: 'JTA', name: 'Japan Transocean Air' },
  { id: 'HAC', name: 'Hokkaido Air System' },
  { id: 'RAC', name: 'Ryukyu Air Commuter' }
];

const FLIGHT_PHASES = [
  "BOARDING", "TAXI", "TAKEOFF", "CLIMB", "CRUISE", "DESCENT", "FINAL", "LANDING", "DEBOARDING"
];

const WEATHER_OPTIONS = [
  "CLEAR", "RAIN", "SNOW", "CLOUDY", "HEAVY THUNDERSTORM"
];

type Props = {
  show: boolean;
  onClose: () => void;
  webhookUrl?: string;
};

type ASRFields = {
  airline: string;
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
  return `${dd}/${mm}/${yyyy}`;
}

function formatTimeHHMM(val: string) {
  if (!val) return "";
  const [hh, mm] = val.split(":");
  return `${hh}:${mm}`;
}

export default function ASRModal({ show, onClose, webhookUrl = "YOUR_DISCORD_WEBHOOK_URL" }: Props) {
  const { t } = useLanguage();
  const [fields, setFields] = useState<ASRFields>({
    airline: AIRLINES[0].id,
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
  const [feedback, setFeedback] = useState<{message: string, type: 'success'|'error'}|null>(null);
  const [narrativeWords, setNarrativeWords] = useState(0);
  const [rawDate, setRawDate] = useState<string>('');
  const [rawTime, setRawTime] = useState<string>('');
  const [currentTime, setCurrentTime] = useState({
    local: '',
    utc: ''
  });

  // Real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Local time
      const localHours = now.getHours().toString().padStart(2, '0');
      const localMinutes = now.getMinutes().toString().padStart(2, '0');
      
      // UTC time
      const utcHours = now.getUTCHours().toString().padStart(2, '0');
      const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
      
      setCurrentTime({
        local: `${localHours}:${localMinutes}`,
        utc: `${utcHours}:${utcMinutes}`
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (show) {
      setFields({
        airline: AIRLINES[0].id,
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

    const selectedAirline = AIRLINES.find(a => a.id === fields.airline)?.name || 'Unknown';
    const idPrefix = fields.airline;
    const fullId = `${idPrefix}${fields.jalId}`;

    const embedContent = {
      embeds: [
        {
          title: "AIR SAFETY REPORT (ASR)",
          color: 0xCC0000, // JAL Red color
          fields: [
            { name: "AIRLINE", value: selectedAirline, inline: true },
            { name: "PILOT ID", value: fullId || '-', inline: true },
            { name: "CALLSIGN", value: fields.callsign || '-', inline: true },
            { name: "DATE OF OCCURENCE", value: fields.date || '-', inline: true },
            { name: "TIME (UTC)", value: fields.time || '-', inline: true },
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
          footer: { text: "JAL EFB - ASR System" }
        }
      ]
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedContent),
      });
      if (res.ok) {
        setFeedback({message: "ASR submitted successfully", type: 'success'});
      } else {
        setFeedback({message: "Failed to submit ASR", type: 'error'});
      }
    } catch {
      setFeedback({message: "Failed to submit ASR", type: 'error'});
    }
    setIsSending(false);
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="relative w-full max-w-6xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header with real-time clock */}
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icon icon="mdi:alert-circle" width={24} className="text-red-400" />
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-white">Air Safety Report</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{currentTime.local} Local</span>
                <span className="text-gray-500">|</span>
                <span>{currentTime.utc} UTC</span>
              </div>
            </div>
          </div>
          {/* close button removed; wrapper handles closing */}
        </div>

        <div className="flex h-[600px] overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Airline Dropdown */}
              <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Airline</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition appearance-none font-mono"
                    value={fields.airline}
                    onChange={e => handleField('airline', e.target.value)}
                  >
                    {AIRLINES.map(airline => (
                      <option 
                        key={airline.id} 
                        value={airline.id}
                        className="font-mono"
                      >
                        {airline.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* JAL Group ID */}
              <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pilot ID
                </label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.jalId}
                  onChange={e => handleField('jalId', e.target.value.replace(/\D/g, ''))}
                  placeholder={`Enter your ${fields.airline} ID NUMBER`}
                />
              </div>

              {/* Callsign */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Callsign</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.callsign}
                  onChange={e => handleField('callsign', e.target.value)}
                  placeholder="Flight Callsign"
                />
              </div>

              {/* Date */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Date of Occurrence</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={rawDate}
                  onChange={e => setRawDate(e.target.value)}
                />
              </div>

              {/* Time */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Time (UTC)</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={rawTime}
                  onChange={e => setRawTime(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Location (ICAO)</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.location}
                  onChange={e => handleField('location', e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="ICAO Code"
                />
              </div>

              {/* Aircraft Type */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Aircraft Type</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.acType}
                  onChange={e => handleField('acType', e.target.value)}
                  placeholder="e.g. B788, B738"
                />
              </div>

              {/* Registration */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Registration</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.registration}
                  onChange={e => handleField('registration', e.target.value)}
                  placeholder="e.g. JA123J"
                />
              </div>

              {/* POB */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">POB</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.pob}
                  onChange={e => handleField('pob', e.target.value)}
                  type="number"
                  min={0}
                  placeholder="Total onboard"
                />
              </div>

              {/* Flight Phase */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Flight Phase</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition appearance-none font-mono"
                    value={fields.flightPhase}
                    onChange={e => handleField('flightPhase', e.target.value)}
                  >
                    {FLIGHT_PHASES.map(phase => (
                      <option key={phase} value={phase} className="font-mono">{phase}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.network}
                  onChange={e => handleField('network', e.target.value)}
                  placeholder="e.g. IVAO, VATSIM"
                />
              </div>

              {/* ATC */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">ATC Station</label>
                <input
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition font-mono"
                  value={fields.atc}
                  onChange={e => handleField('atc', e.target.value)}
                  placeholder="e.g. RJTT_TWR 118.1"
                />
              </div>

              {/* Weather */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Weather</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition appearance-none font-mono"
                    value={fields.weather}
                    onChange={e => handleField('weather', e.target.value)}
                  >
                    {WEATHER_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="font-mono">{opt}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Narrative */}
              <div className="col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">Event Narrative</label>
                  <span className="text-xs text-gray-400 font-mono">{narrativeWords}/{maxWords} words</span>
                </div>
                <textarea
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition min-h-[150px] font-mono"
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
                  placeholder="Describe the event in detail..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center">
          {feedback && (
            <div className={`text-sm font-medium px-3 py-1.5 rounded ${
              feedback.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {feedback.message}
            </div>
          )}
          
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSending || narrativeWords === 0}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center space-x-2 ${
                isSending || narrativeWords === 0
                  ? 'bg-red-600/50 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSending ? (
                <>
                  <Icon icon="line-md:loading-twotone-loop" className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:send" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}