'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../lib/LanguageContext';

const CONTINENTS = [
  {
    name: 'North America',
    airports: [
      { code: 'KLAX', city: 'Los Angeles', country: '🇺🇸 USA', timezone: 'America/Los_Angeles' },
      { code: 'CYVR', city: 'Vancouver', country: '🇨🇦 Canada', timezone: 'America/Vancouver' },
      { code: 'MMMX', city: 'Mexico City', country: '🇲🇽 Mexico', timezone: 'America/Mexico_City' },
      { code: 'KDFW', city: 'Dallas', country: '🇺🇸 USA', timezone: 'America/Chicago' },
      { code: 'KJFK', city: 'New York', country: '🇺🇸 USA', timezone: 'America/New_York' },
      { code: 'KMIA', city: 'Miami', country: '🇺🇸 USA', timezone: 'America/New_York' },
      { code: 'CYUL', city: 'Montreal', country: '🇨🇦 Canada', timezone: 'America/Toronto' },
    ]
  },
  {
    name: 'South America',
    airports: [
      { code: 'SKBO', city: 'Bogotá', country: '🇨🇴 Colombia', timezone: 'America/Bogota' },
      { code: 'SBGR', city: 'São Paulo', country: '🇧🇷 Brazil', timezone: 'America/Sao_Paulo' },
      { code: 'SAEZ', city: 'Buenos Aires', country: '🇦🇷 Argentina', timezone: 'America/Argentina/Buenos_Aires' },
      { code: 'SCEL', city: 'Santiago', country: '🇨🇱 Chile', timezone: 'America/Santiago' },
    ]
  },
  {
    name: 'Europe',
    airports: [
      { code: 'EGLL', city: 'London', country: '🇬🇧 UK', timezone: 'Europe/London' },
      { code: 'LPPT', city: 'Lisbon', country: '🇵🇹 Portugal', timezone: 'Europe/Lisbon' },
      { code: 'LFPG', city: 'Paris', country: '🇫🇷 France', timezone: 'Europe/Paris' },
      { code: 'LEMD', city: 'Madrid', country: '🇪🇸 Spain', timezone: 'Europe/Madrid' },
      { code: 'EDDF', city: 'Frankfurt', country: '🇩🇪 Germany', timezone: 'Europe/Berlin' },
      { code: 'LIMC', city: 'Milan', country: '🇮🇹 Italy', timezone: 'Europe/Rome' },
      { code: 'UUDD', city: 'Moscow', country: '🇷🇺 Russia', timezone: 'Europe/Moscow' },
      { code: 'LBSF', city: 'Sofia', country: '🇧🇬 Bulgaria', timezone: 'Europe/Sofia' },
      { code: 'LGRP', city: 'Athens', country: '🇬🇷 Greece', timezone: 'Europe/Athens' },
    ]
  },
  {
    name: 'Africa',
    airports: [
      { code: 'DNMM', city: 'Lagos', country: '🇳🇬 Nigeria', timezone: 'Africa/Lagos' },
      { code: 'HECA', city: 'Cairo', country: '🇪🇬 Egypt', timezone: 'Africa/Cairo' },
      { code: 'FAOR', city: 'Johannesburg', country: '🇿🇦 South Africa', timezone: 'Africa/Johannesburg' },
    ]
  },
  {
    name: 'Asia',
    airports: [
      { code: 'LTFM', city: 'Istanbul', country: '🇹🇷 Turkey', timezone: 'Europe/Istanbul' },
      { code: 'ORBI', city: 'Baghdad', country: '🇮🇶 Iraq', timezone: 'Asia/Baghdad' },
      { code: 'OMDB', city: 'Dubai', country: '🇦🇪 UAE', timezone: 'Asia/Dubai' },
      { code: 'OIMM', city: 'Tehran', country: '🇮🇷 Iran', timezone: 'Asia/Tehran' },
      { code: 'VIDP', city: 'New Delhi', country: '🇮🇳 India', timezone: 'Asia/Kolkata' },
      { code: 'ZBAA', city: 'Beijing', country: '🇨🇳 China', timezone: 'Asia/Shanghai' },
      { code: 'VHHH', city: 'Hong Kong', country: '🇭🇰 China', timezone: 'Asia/Hong_Kong' },
      { code: 'WSSS', city: 'Singapore', country: '🇸🇬 Singapore', timezone: 'Asia/Singapore' },
      { code: 'RJTT', city: 'Tokyo', country: '🇯🇵 Japan', timezone: 'Asia/Tokyo' },
      { code: 'RKSI', city: 'Seoul', country: '🇰🇷 Korea', timezone: 'Asia/Seoul' },
    ]
  },
  {
    name: 'Oceania',
    airports: [
      { code: 'YSSY', city: 'Sydney', country: '🇦🇺 Australia', timezone: 'Australia/Sydney' },
      { code: 'NZAA', city: 'Auckland', country: '🇳🇿 New Zealand', timezone: 'Pacific/Auckland' },
    ]
  }
];

const AnalogClock = ({ timezone }: { timezone: string }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const localTime = new Date(time.toLocaleString('en-US', { timeZone: timezone }));
  const hours = localTime.getHours() % 12;
  const minutes = localTime.getMinutes();
  const seconds = localTime.getSeconds();

  return (
    <div className="relative w-32 h-32">
      {/* Clock face image */}
      <img 
        src="/Images/clock.png" 
        alt="Clock face"
        className="absolute w-full h-full object-contain"
      />
      
      {/* Clock hands - all white except seconds */}
      <div className="absolute inset-0">
        {/* Hour hand - thicker and white */}
        <div 
          className="absolute w-[5px] h-[36px] bg-white left-1/2 bottom-1/2 origin-bottom"
          style={{ 
            transform: `translateX(-50%) rotate(${hours * 30 + minutes * 0.5}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        
        {/* Minute hand - thicker and white */}
        <div 
          className="absolute w-[4px] h-[48px] bg-white left-1/2 bottom-1/2 origin-bottom"
          style={{ 
            transform: `translateX(-50%) rotate(${minutes * 6}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        
        {/* Second hand - kept red for visibility */}
        <div 
          className="absolute w-[2px] h-[52px] bg-red-500 left-1/2 bottom-1/2 origin-bottom"
          style={{ 
            transform: `translateX(-50%) rotate(${seconds * 6}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        
        {/* Center dot - white */}
        <div className="absolute w-3 h-3 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
};

const getCurrentUTCOffset = (timezone: string) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(new Date());
  const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
  return timeZoneName.startsWith('GMT') ? timeZoneName : 'UTC';
};

export default function WorldClockModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedContinent, setSelectedContinent] = useState(CONTINENTS[0]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort airports by current UTC offset
  const sortedAirports = [...selectedContinent.airports].sort((a, b) => {
    const offsetA = new Date().getTimezoneOffset() - 
                   new Date(currentTime.toLocaleString('en-US', { timeZone: a.timezone })).getTimezoneOffset();
    const offsetB = new Date().getTimezoneOffset() - 
                   new Date(currentTime.toLocaleString('en-US', { timeZone: b.timezone })).getTimezoneOffset();
    return offsetA - offsetB;
  });

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <div className="relative w-full max-w-7xl bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-600/50 backdrop-blur-xl">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-800/95 to-slate-800/95 backdrop-blur-sm px-8 py-6 border-b border-gray-600/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Icon icon="mdi:clock-outline" width={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🕐 {t.clock.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">World time zones and airport clocks</p>
            </div>
          </div>
          {/* Enhanced decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
        </div>
        
        <div className="flex h-[650px] overflow-hidden">
          {/* Enhanced Navigation - Continents */}
          <div className="w-72 bg-gradient-to-b from-gray-800/95 to-slate-800/95 backdrop-blur-sm border-r border-gray-600/50 p-6 overflow-y-auto">
            <div className="space-y-3">
              {CONTINENTS.map((continent) => (
                <button
                  key={continent.name}
                  onClick={() => setSelectedContinent(continent)}
                  className={`w-full text-left px-5 py-4 rounded-xl flex items-center space-x-4 transition-all duration-300 transform hover:scale-105 ${
                    selectedContinent.name === continent.name
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedContinent.name === continent.name ? 'bg-white/20' : 'bg-gray-700/50'}`}>
                    <Icon 
                      icon={
                        continent.name === 'North America' ? 'mdi:earth-americas' :
                        continent.name === 'South America' ? 'mdi:earth-americas' :
                        continent.name === 'Europe' ? 'mdi:earth-europe' :
                        continent.name === 'Africa' ? 'mdi:earth-africa' :
                        continent.name === 'Asia' ? 'mdi:earth-asia' :
                        'mdi:earth-oceania'
                      } 
                      width={20} 
                    />
                  </div>
                  <div>
                    <div className="font-semibold">{continent.name}</div>
                    <div className="text-xs opacity-75">{continent.airports.length} airports</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Main Content - Airports */}
          <div className="flex-1 bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm overflow-y-auto p-8">
            <div className="space-y-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                  <Icon icon="mdi:clock-outline" width={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    🌍 {selectedContinent.name}
                  </h3>
                  <p className="text-gray-400 mt-2">Airports ordered by current local time</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAirports.map((airport) => {
                  const localTime = currentTime.toLocaleTimeString('en-US', {
                    timeZone: airport.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });
                  
                  const localDate = currentTime.toLocaleDateString('en-US', {
                    timeZone: airport.timezone,
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });

                  const utcOffset = getCurrentUTCOffset(airport.timezone);

                  return (
                    <div 
                      key={airport.code} 
                      className="p-6 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-400/50 flex flex-col items-center"
                    >
                      <div className="mb-4">
                        <AnalogClock timezone={airport.timezone} />
                      </div>
                      <div className="text-center w-full">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-white text-lg">{airport.city}</h3>
                          <span className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold">
                            {airport.code}
                          </span>
                        </div>
                        <div className="text-3xl font-mono font-black text-blue-400 mb-2">
                          {localTime}
                        </div>
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                          <span className="font-medium">{localDate}</span>
                          <span className="font-mono">{utcOffset}</span>
                        </div>
                        <div className="text-sm text-gray-400 font-medium">
                          {airport.country}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-3 text-center text-sm text-gray-400">
          Current system time: {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </Modal>
  );
}