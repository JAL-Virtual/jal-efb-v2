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
      <div className="relative w-full max-w-6xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icon icon="mdi:clock-outline" className="text-xl text-blue-400" />
            <h2 className="text-xl font-semibold text-white">{t.clock.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            {/* close button removed; wrapper handles closing */}
          </button>
        </div>
        
        <div className="flex h-[600px] overflow-hidden">
          {/* Navigation - Continents */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-1">
              {CONTINENTS.map((continent) => (
                <button
                  key={continent.name}
                  onClick={() => setSelectedContinent(continent)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    selectedContinent.name === continent.name
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
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
                  <span>{continent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Airports */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <Icon icon="mdi:clock-outline" width={28} className="text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedContinent.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Airports ordered by current local time
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="p-4 rounded-lg border border-blue-800/30 bg-gray-800/50 transition-all hover:shadow-lg hover:scale-[1.02] flex flex-col items-center"
                    >
                      <AnalogClock timezone={airport.timezone} />
                      <div className="mt-4 text-center w-full">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-white">{airport.city}</h3>
                          <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-300">
                            {airport.code}
                          </span>
                        </div>
                        <div className="text-2xl font-mono font-bold text-blue-400 mb-1">
                          {localTime}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{localDate}</span>
                          <span>{utcOffset}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
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