'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icon } from "@iconify/react";

const AVWX_API_KEY = "CbotJ3ch3Ze94Jn5BoXlou_oYbntLVODS3C7Vj5-f8M";

function parseMetar(rawMetar: string): {
  station: string;
  timestamp: string;
  wind: string;
  visibility: string;
  weather: string[];
  clouds: { coverage: string; altitude: string; type?: string }[];
  temperature: string;
  dewpoint: string;
  altimeter: string;
  forecast: string;
  remarks: { code: string; meaning: string }[];
  plainEnglish: string;
} | null {
  if (!rawMetar) return null;

  let temp = 'N/A';
  let dewpoint = 'N/A';
  let altimeter = 'N/A';
  let forecast = '';

  const hpaToInHg = (hpa: number): number =>
    parseFloat((hpa / 33.8639).toFixed(2));

  const parts = rawMetar.split('RMK');
  const mainPart = parts[0].trim();
  const remarks = parts[1] ? parts[1].trim() : '';

  const components = mainPart.split(/\s+/).filter(Boolean);
  if (components.length < 4) return null;

  const station = components[0];
  const timeMatch = components[1].match(/^(\d{2})(\d{2})(\d{2})Z$/);
  if (!timeMatch) return null;

  const day = timeMatch[1];
  const hours = timeMatch[2];
  const minutes = timeMatch[3];
  const timestamp = `${day}th at ${hours}:${minutes} Zulu`;

  let index = 2;
  if (components[index] === 'AUTO' || components[index] === 'COR') index++;

  let wind = 'Calm';
  const windMatch = components[index]?.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT$/);
  if (windMatch) {
    const direction = windMatch[1] === 'VRB' ? 'Variable' : `${windMatch[1]}°`;
    const speed = windMatch[2];
    const gust = windMatch[3] ? ` gusting ${windMatch[3]} knots` : '';
    wind = `From ${direction} at ${speed} knots${gust}`;
  }
  index++;

  let visibility = '';
  const visComponent = components[index];
  if (visComponent === 'CAVOK') {
    visibility = 'Ceiling and visibility OK';
    index++;
  } else if (visComponent === '9999') {
    visibility = '10 kilometers or more';
    index++;
  } else {
    const visMatch = visComponent?.match(/^(\d+\s\d+\/\d+|\d+\/\d+|\d+)(SM)?$/);
    if (visMatch) {
      const value = visMatch[1];
      const isSM = visMatch[2];
      visibility = isSM ? `${value} statute miles` : `${value} meters`;
      index++;
    }
  }

  const weatherCodes: Record<string, string> = {
    VC: 'in vicinity', RA: 'rain', SH: 'showers', TS: 'thunderstorm',
    HZ: 'haze', BR: 'mist', FG: 'fog', SN: 'snow', PL: 'ice pellets',
    GR: 'hail', GS: 'small hail', SQ: 'squalls', DS: 'duststorm',
    SS: 'sandstorm', DU: 'dust', FU: 'smoke', DZ: 'drizzle', SG: 'snow grains'
  };

  const weather: string[] = [];
  let cloudStartIndex = index;

  for (let i = index; i < components.length; i++) {
    if (components[i].match(/^(FEW|SCT|BKN|OVC|VV|NCD)\d{3}/)) {
      cloudStartIndex = i;
      break;
    }

    let code = components[i];
    let desc = '';

    if (code.startsWith('VC')) {
      desc += 'in vicinity ';
      code = code.substring(2);
    }

    if (code.startsWith('-') || code.startsWith('+')) {
      desc += code[0] === '-' ? 'Light ' : 'Heavy ';
      code = code.substring(1);
    }

    while (code.length >= 2) {
      const segment = code.substring(0, 2);
      desc += weatherCodes[segment] ? `${weatherCodes[segment]} ` : `${segment} `;
      code = code.substring(2);
    }

    weather.push(desc.trim());
  }

  const clouds: { coverage: string; altitude: string; type?: string }[] = [];
  for (let i = cloudStartIndex; i < components.length; i++) {
    const part = components[i];

    const cloudMatch = part.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/);
    if (cloudMatch) {
      const coverageMap: Record<string, string> = {
        FEW: 'Few', SCT: 'Scattered', BKN: 'Broken', OVC: 'Overcast', VV: 'Vertical Visibility'
      };
      const coverage = coverageMap[cloudMatch[1]] || cloudMatch[1];
      const altitude = `${parseInt(cloudMatch[2]) * 100} ft`;
      const type = cloudMatch[3] === 'CB' ? 'cumulonimbus' :
                   cloudMatch[3] === 'TCU' ? 'towering cumulus' : undefined;

      clouds.push({ coverage, altitude, type });
      continue;
    }

    const tempMatch = part.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (tempMatch) {
      temp = `${tempMatch[1].replace('M', '-')}°C`;
      dewpoint = `${tempMatch[2].replace('M', '-')}°C`;
      continue;
    }

    const altimeterMatch = part.match(/^A(\d{4})$/);
    if (altimeterMatch) {
      altimeter = `${(parseInt(altimeterMatch[1]) / 100).toFixed(2)} inHg`;
      continue;
    }

    const qnhMatch = part.match(/^Q(\d{4})$/);
    if (qnhMatch) {
      const hpa = parseInt(qnhMatch[1]);
      const inHg = hpaToInHg(hpa);
      altimeter = `${inHg} inHg (${hpa} hPa)`;
      continue;
    }

    if (part === 'NOSIG') forecast = 'No significant change expected';
  }

  const parsedRemarks: { code: string; meaning: string }[] = [];

  if (remarks) {
    if (remarks.includes('AO1')) parsedRemarks.push({ code: 'AO1', meaning: 'Automated station w/o precipitation sensor' });
    if (remarks.includes('AO2')) parsedRemarks.push({ code: 'AO2', meaning: 'Automated station with precipitation sensor' });

    const slpMatch = remarks.match(/SLP(\d{3})/);
    if (slpMatch) {
      const pressure = 1000 + parseInt(slpMatch[1]) / 10;
      parsedRemarks.push({ code: `SLP${slpMatch[1]}`, meaning: `Sea-level pressure: ${pressure.toFixed(1)} hPa` });
    }

    const tMatch = remarks.match(/T(\d{4})(\d{4})/);
    if (tMatch) {
      const parseTemp = (val: string) => (val[0] === '1' ? '-' : '') + (parseInt(val.substring(1)) / 10).toFixed(1) + '°C';
      parsedRemarks.push({ code: `T${tMatch[1]}${tMatch[2]}`, meaning: `Precise temperature: ${parseTemp(tMatch[1])}, dew point: ${parseTemp(tMatch[2])}` });
    }

    if (remarks.includes('$')) parsedRemarks.push({ code: '$', meaning: 'Automated station requires maintenance' });

    const ltgMatch = remarks.match(/(OCNL|FRQ|CONS)? ?LTG([A-Z]+) ?([NESW]+)?/);
    if (ltgMatch) {
      parsedRemarks.push({
        code: `LTG${ltgMatch[2]} ${ltgMatch[3] || ''}`.trim(),
        meaning: `${ltgMatch[1] || 'Unspecified frequency'} lightning (${ltgMatch[2]})${ltgMatch[3] ? ' to the ' + ltgMatch[3] : ''}`
      });
    }

    const tsbMatch = remarks.match(/TSB(\d{2})/);
    if (tsbMatch) {
      parsedRemarks.push({ code: `TSB${tsbMatch[1]}`, meaning: `Thunderstorm began at ${tsbMatch[1]} minutes past the hour` });
    }

    const cloudInfoMatch = remarks.match(/(\d)\/(\d{3})/);
    if (cloudInfoMatch) {
      const coverage = cloudInfoMatch[1];
      const info = cloudInfoMatch[2];
      const height = parseInt(info.substring(1)) * 100;
      parsedRemarks.push({
        code: `${coverage}/${info}`,
        meaning: `Clouds: ${coverage}/8 coverage at ~${height.toLocaleString()} ft (code group)`
      });
    }

    if (remarks.includes('HZY')) parsedRemarks.push({ code: 'HZY', meaning: 'Hazy conditions' });
    if (remarks.includes('VSBY LWR')) parsedRemarks.push({ code: 'VSBY LWR', meaning: 'Visibility lower in some directions' });

    // Always put raw last
    parsedRemarks.push({ code: 'RAW', meaning: `RMK ${remarks}` });
  }

  const plainEnglishParts = [
    `At ${hours}:${minutes} UTC on the ${day}th, ${station} reported:`,
    `Winds ${wind.toLowerCase()}`,
    `Visibility ${visibility.toLowerCase()}`,
    weather.length ? `with ${weather.join(', ')}` : '',
    clouds.length ? `, clouds: ${clouds.map(c => `${c.coverage.toLowerCase()} ${c.type ? c.type + ' ' : ''}at ${c.altitude}`).join(', ')}` : '',
    `, temperature ${temp}`,
    `, dew point ${dewpoint}`,
    `, altimeter ${altimeter}`,
    forecast ? `, ${forecast.toLowerCase()}` : '',
    parsedRemarks.length > 1 ? `. Remarks: ${parsedRemarks.slice(0, -1).map(r => r.meaning).join('; ')}` : ''
  ];

  return {
    station,
    timestamp,
    wind,
    visibility,
    weather,
    clouds,
    temperature: temp,
    dewpoint,
    altimeter,
    forecast,
    remarks: parsedRemarks,
    plainEnglish: plainEnglishParts.filter(Boolean).join('')
  };
}

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
  const [decoding, setDecoding] = useState(false);
  const [metar, setMetar] = useState<string | null>(null);
  const [taf, setTaf] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decodedMetar, setDecodedMetar] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'lookup' | 'decoded'>('lookup');

  useEffect(() => {
    if (show) {
      setIcao('');
      setMetar(null);
      setTaf(null);
      setStationName(null);
      setError(null);
      setLoading(false);
      setDecodedMetar(null);
      setActiveSection('lookup');
    }
  }, [show]);

  async function handleFetch() {
    setLoading(true);
    setMetar(null);
    setTaf(null);
    setStationName(null);
    setError(null);
    setDecodedMetar(null);

    const res = await fetchWeather(icao.trim().toUpperCase());

    setMetar(res.metar || null);
    setTaf(res.taf || null);
    setStationName(res.metarStation || null);
    setError(res.error || null);
    setLoading(false);
  }

  async function handleDecode() {
    if (!metar) return;
    
    setDecoding(true);
    const decoded = parseMetar(metar);
    setDecodedMetar(decoded);
    if (!decoded) setError('Failed to parse METAR');
    setDecoding(false);
    setActiveSection('decoded');
  }

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      {/* Hidden number input spinners */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="relative w-full max-w-7xl bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-600/50 backdrop-blur-xl">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-800/95 to-slate-800/95 backdrop-blur-sm px-8 py-6 border-b border-gray-600/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Icon icon="mdi:weather-partly-cloudy" width={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🌤️ Weather Center
              </h2>
              <p className="text-sm text-gray-400 mt-1">Real-time aviation weather data</p>
            </div>
          </div>
          {/* Enhanced decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
        </div>

        <div className="flex h-[650px] overflow-hidden">
          {/* Enhanced Navigation */}
          <div className="w-72 bg-gradient-to-b from-gray-800/95 to-slate-800/95 backdrop-blur-sm border-r border-gray-600/50 p-6 overflow-y-auto">
            <div className="space-y-3">
              {([
                {id: 'lookup', icon: 'mdi:weather-cloudy', label: 'METAR/TAF Lookup', emoji: '🔍'},
                {id: 'decoded', icon: 'mdi:file-document-outline', label: 'Decoded Report', emoji: '📊'},
              ] as {id: 'lookup' | 'decoded', icon: string, label: string, emoji: string}[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl flex items-center space-x-4 transition-all duration-300 transform hover:scale-105 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                  disabled={item.id === 'decoded' && !metar}
                >
                  <div className={`p-2 rounded-lg ${activeSection === item.id ? 'bg-white/20' : 'bg-gray-700/50'}`}>
                    <Icon icon={item.icon} width={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{item.emoji} {item.label}</div>
                    <div className="text-xs opacity-75">
                      {item.id === 'lookup' ? 'Fetch weather data' : 'View decoded info'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="flex-1 bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm overflow-y-auto p-8">
            {/* Lookup Section */}
            {activeSection === 'lookup' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                    <Icon icon="mdi:weather-cloudy" width={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">🔍 METAR / TAF Lookup</h3>
                    <p className="text-gray-400 mt-2">Fetch real-time weather reports for any airport worldwide</p>
                  </div>
                </div>

                {/* Enhanced Search Input */}
                <div className="mb-8">
                  <div className="relative">
                    <input
                      className="w-full px-6 py-4 bg-gradient-to-r from-gray-800/80 to-slate-800/80 border-2 border-gray-600/50 rounded-2xl text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 uppercase tracking-widest backdrop-blur-sm hover:bg-gray-700/80"
                      value={icao}
                      onChange={e => setIcao(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                      placeholder="Enter ICAO code (e.g., RJTT)"
                      maxLength={4}
                      autoFocus
                      spellCheck={false}
                    />
                    <div className="absolute right-4 top-4 p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Icon icon="mdi:airplane" width={20} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={handleFetch}
                      disabled={loading || icao.length !== 4}
                      className={`flex-1 px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 ${
                        loading || icao.length !== 4
                          ? 'bg-gradient-to-r from-gray-700 to-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-3">
                          <Icon icon="mdi:loading" className="animate-spin" width={24} />
                          🌤️ Fetching Weather Data...
                        </span>
                      ) : (
                        '🌤️ Fetch METAR & TAF'
                      )}
                    </button>

                    {metar && (
                      <button
                        onClick={handleDecode}
                        className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        📊 Decode METAR
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-6">
                  {stationName && (
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-2 text-blue-400 mb-2">
                        <Icon icon="mdi:office-building-marker" width={20} />
                        <span className="font-medium">Station Information</span>
                      </div>
                      <div className="text-white font-semibold">{stationName}</div>
                    </div>
                  )}

                  {metar && (
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-2 text-blue-400 mb-2">
                        <Icon icon="mdi:weather-windy" width={20} />
                        <span className="font-medium">METAR</span>
                      </div>
                      <div className="font-mono text-white bg-gray-700 p-3 rounded-md whitespace-pre-wrap break-words">
                        {metar}
                      </div>
                    </div>
                  )}

                  {taf && (
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-2 text-blue-400 mb-2">
                        <Icon icon="mdi:weather-night-partly-cloudy" width={20} />
                        <span className="font-medium">TAF</span>
                      </div>
                      <div className="font-mono text-white bg-gray-700 p-3 rounded-md whitespace-pre-wrap break-words">
                        {taf}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-900/30 rounded-lg border border-red-700 text-red-400 font-medium">
                      <div className="flex items-center space-x-2">
                        <Icon icon="mdi:alert-circle" width={20} />
                        <span>Error: {error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decoded Report Section */}
            {activeSection === 'decoded' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Icon icon="mdi:file-document-outline" width={28} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white">Decoded METAR Report</h3>
                    <p className="text-sm text-gray-400">Detailed breakdown of the METAR information</p>
                  </div>
                </div>

                {decoding ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Icon icon="mdi:loading" className="animate-spin" width={24} />
                      <span>Decoding METAR...</span>
                    </div>
                  </div>
                ) : decodedMetar ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:information-outline" className="mr-2 text-blue-400" />
                          Basic Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-gray-400">Station</div>
                            <div className="text-white font-mono">{decodedMetar.station || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Time</div>
                            <div className="text-white font-mono">{decodedMetar.timestamp || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Wind */}
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:weather-windy" className="mr-2 text-blue-400" />
                          Wind Information
                        </h4>
                        <div className="text-white font-mono">
                          {decodedMetar.wind || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Visibility */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Icon icon="mdi:eye-outline" className="mr-2 text-blue-400" />
                        Visibility
                      </h4>
                      <div className="text-white font-mono">
                        {decodedMetar.visibility || 'N/A'}
                      </div>
                    </div>

                    {/* Weather Phenomena */}
                    {decodedMetar.weather.length > 0 && (
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:weather-pouring" className="mr-2 text-blue-400" />
                          Weather
                        </h4>
                        <div className="space-y-2">
                          {decodedMetar.weather.map((w: string, i: number) => (
                            <div key={i} className="text-white font-mono">{w}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clouds */}
                    {decodedMetar.clouds.length > 0 && (
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:weather-cloudy" className="mr-2 text-blue-400" />
                          Cloud Layers
                        </h4>
                        <div className="space-y-2">
                          {decodedMetar.clouds.map((cloud: any, index: number) => (
                            <div key={index} className="flex items-center space-x-4">
                              <div className="text-white font-mono flex-1">
                                {cloud.coverage} {cloud.type || ''} at {cloud.altitude}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Temperature */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:thermometer" className="mr-2 text-blue-400" />
                          Temperature
                        </h4>
                        <div className="text-white font-mono">
                          {decodedMetar.temperature || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:water-percent" className="mr-2 text-blue-400" />
                          Dew Point
                        </h4>
                        <div className="text-white font-mono">
                          {decodedMetar.dewpoint || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Altimeter */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Icon icon="mdi:gauge" className="mr-2 text-blue-400" />
                        Altimeter
                      </h4>
                      <div className="text-white font-mono">
                        {decodedMetar.altimeter || 'N/A'}
                      </div>
                    </div>

                    {/* Forecast */}
                    {decodedMetar.forecast && (
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:weather-partly-cloudy" className="mr-2 text-blue-400" />
                          Forecast
                        </h4>
                        <div className="text-white font-mono">
                          {decodedMetar.forecast}
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    {decodedMetar.remarks.length > 0 && (
                      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                          <Icon icon="mdi:note-text-outline" className="mr-2 text-blue-400" />
                          Remarks
                        </h4>
                        <div className="space-y-2">
                          {decodedMetar.remarks.map((r: any, i: number) => (
                            <div key={i} className="text-white">
                              <span className="font-mono text-blue-300">{r.code}:</span> {r.meaning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Plain English Summary */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Icon icon="mdi:translate" className="mr-2 text-blue-400" />
                        Plain English Summary
                      </h4>
                      <div className="text-white">
                        {decodedMetar.plainEnglish}
                      </div>
                    </div>

                    {/* Raw METAR */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Icon icon="mdi:code-json" className="mr-2 text-blue-400" />
                        Original METAR
                      </h4>
                      <div className="font-mono text-white bg-gray-700 p-3 rounded-md whitespace-pre-wrap break-words">
                        {metar}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-700 text-yellow-400 font-medium">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:alert-circle" width={20} />
                      <span>No decoded METAR available. Please fetch and decode a METAR first.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center">
          {error && (
            <div className="text-sm font-medium px-3 py-1.5 rounded bg-red-900/30 text-red-400">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}