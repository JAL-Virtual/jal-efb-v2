'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';
import { Icon } from "@iconify/react";

const AVWX_API_KEY = "m3T9UiBmhV7yW_45aunj-lizRjijD7BcRWzYGWM6fvU";

async function fetchWeather(icao: string): Promise<{
  metar: string;
  metarStation: string;
  taf: string;
  tafStation: string;
  error?: string;
}> {
  if (!icao) return { metar: '', metarStation: '', taf: '', tafStation: '', error: 'No ICAO code entered.' };
  try {
    const stationRes = await fetch(`https://avwx.rest/api/station/${icao}`, {
      headers: { Authorization: `Bearer ${AVWX_API_KEY}` },
    });
    const stationData = await stationRes.json();
    const stationName = stationData?.name || '';

    const metarRes = await fetch(`https://avwx.rest/api/metar/${icao}?format=json`, {
      headers: { Authorization: `Bearer ${AVWX_API_KEY}` },
    });
    const metarData = await metarRes.json();
    const metarRaw = metarData?.raw || '';

    const tafRes = await fetch(`https://avwx.rest/api/taf/${icao}?format=json`, {
      headers: { Authorization: `Bearer ${AVWX_API_KEY}` },
    });
    const tafData = await tafRes.json();
    const tafRaw = tafData?.raw || '';

    return {
      metar: metarRaw,
      metarStation: stationName,
      taf: tafRaw,
      tafStation: stationName,
      error: '',
    };
  } catch (err: any) {
    return { metar: '', metarStation: '', taf: '', tafStation: '', error: 'Failed to fetch weather.' };
  }
}

type Props = {
  show: boolean;
  onClose: () => void;
};

export default function WeatherModal({ show, onClose }: Props) {
  const [icao, setIcao] = useState('');
  const [loading, setLoading] = useState(false);
  const [metar, setMetar] = useState<string | null>(null);
  const [taf, setTaf] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (show) {
      setIcao('');
      setMetar(null);
      setTaf(null);
      setStationName(null);
      setError(null);
      setLoading(false);
      setShowResult(false);
    }
  }, [show]);

  async function handleFetch() {
    setLoading(true);
    setMetar(null);
    setTaf(null);
    setStationName(null);
    setError(null);
    setShowResult(false);

    const res = await fetchWeather(icao.trim().toUpperCase());

    setMetar(res.metar || null);
    setTaf(res.taf || null);
    setStationName(res.metarStation || null);
    setError(res.error || null);
    setLoading(false);
    setTimeout(() => setShowResult(true), 120); // Animate in
  }

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div className="relative max-w-lg mx-auto bg-gradient-to-br from-white/90 via-[#ffeef0]/90 to-[#fff6f7]/95 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(182,12,24,0.10)] border border-[#b60c18]/20">
        {/* Sakura floating icon */}
        <div className="absolute right-7 top-7 z-10 opacity-50 animate-spin-slow">
          <Icon icon="mdi:sakura" width={38} height={38} color="#e9aacb" />
        </div>
        <h2 className="text-3xl font-black mb-4 text-[#b60c18] tracking-tight text-center drop-shadow-sm select-none">
          <span className="inline-block align-middle mr-2 animate-fadein">
            <Icon icon="mdi:weather-partly-cloudy" width={32} height={32} />
          </span>
          METAR / TAF Lookup
        </h2>
        <div className="mb-4 animate-fadein-slow">
          <div className="relative">
            <input
              className="w-full p-3 border-2 border-[#b60c18]/30 rounded-xl bg-black/90 text-white font-mono text-xl shadow focus:outline-none focus:ring-2 focus:ring-[#b60c18] transition placeholder-gray-400 tracking-widest uppercase"
              value={icao}
              onChange={e => setIcao(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              placeholder="RJAA"
              maxLength={4}
              autoFocus
              spellCheck={false}
              style={{ letterSpacing: "0.16em" }}
            />
            <span className="absolute right-4 top-3 text-[#b60c18]/70 pointer-events-none select-none">
              <Icon icon="mdi:airplane" width={24} />
            </span>
          </div>
          <button
            onClick={handleFetch}
            className={`w-full mt-3 py-3 rounded-2xl font-bold shadow-md text-lg
              bg-gradient-to-r from-[#ea4256] via-[#b60c18] to-[#c74264]
              hover:from-[#b60c18] hover:to-[#ea4256] transition-all duration-200
              text-white tracking-wide ring-2 ring-transparent
              ${loading || icao.length !== 4 ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
            `}
            disabled={loading || icao.length !== 4}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Icon icon="mdi:loading" className="animate-spin" width={22} />
                Fetching...
              </span>
            ) : (
              <>Fetch METAR & TAF</>
            )}
          </button>
        </div>
        {/* Results */}
        <div className={`transition-all duration-500 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
          {stationName && (
            <div className="mb-2 text-center flex flex-col items-center gap-1">
              <span className="font-bold text-lg text-[#b60c18] flex items-center justify-center gap-2">
                <Icon icon="mdi:office-building-marker" width={20} className="opacity-70" />
                <span className="text-[#b60c18]/70 font-semibold">Station Name:</span>
                <span className="font-extrabold text-[#b60c18]">{stationName}</span>
              </span>
              <span className="w-20 h-1 rounded-full bg-[#b60c18]/30 mt-1 animate-pulse" />
            </div>
          )}
          {metar && (
            <div className="mb-5 animate-fadein-slow">
              <div className="font-bold text-[#b60c18] flex items-center gap-1">
                <Icon icon="mdi:weather-windy" width={20} className="opacity-80" /> METAR
              </div>
              <div className="font-mono bg-white border-2 border-[#b60c18]/15 p-3 rounded-xl text-black mt-1 break-words shadow-inner text-base select-all tracking-wider transition-all duration-200">
                {metar}
              </div>
            </div>
          )}
          {taf && (
            <div className="mb-3 animate-fadein-slow">
              <div className="font-bold text-[#ea4256] flex items-center gap-1">
                <Icon icon="mdi:weather-night-partly-cloudy" width={20} className="opacity-80" /> TAF
              </div>
              <div className="font-mono bg-white border-2 border-[#ea4256]/15 p-3 rounded-xl text-black mt-1 break-words shadow-inner text-base select-all tracking-wider transition-all duration-200">
                {taf}
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 text-center font-bold text-red-600 animate-shake">{error}</div>
        )}
      </div>
      {/* Keyframes for fadein/animation */}
      <style jsx global>{`
        @keyframes fadein {
          0% { opacity: 0; transform: translateY(-10px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .animate-fadein {
          animation: fadein 0.7s cubic-bezier(.56,1.55,.43,.92) both;
        }
        .animate-fadein-slow {
          animation: fadein 1.3s cubic-bezier(.56,1.55,.43,.92) both;
        }
        @keyframes shake {
          0% { transform: translateX(0);}
          20% { transform: translateX(-8px);}
          40% { transform: translateX(8px);}
          60% { transform: translateX(-6px);}
          80% { transform: translateX(6px);}
          100% { transform: translateX(0);}
        }
        .animate-shake {
          animation: shake 0.3s;
        }
        .animate-spin-slow {
          animation: spin 7s linear infinite;
        }
      `}</style>
    </Modal>
  );
}
