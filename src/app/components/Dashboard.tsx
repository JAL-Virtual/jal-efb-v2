'use client';

import React, { useState, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import SakuraPetals from './SakuraPetals';
import SettingsModal from './SettingsModal';
import IFuelModal from './IFuelModal';
import WeatherModal from './WeatherModal';
import LoadsheetModal from './LoadsheetModal';
import ASRModal from './ASR';
import DelayCodeModal from './DelayCodeModal';
import OPTModal from './OPT';

/** ====== import รูปทั้งหมดจาก public (relative จาก src/app/components) ====== */
import bg from '../../../public/Images/background.png';

import icon_profile   from '../../../public/app-icons/profile.png';
import icon_map       from '../../../public/app-icons/map.png';
import icon_navigraph from '../../../public/app-icons/navigraph.png';
import icon_opt       from '../../../public/app-icons/opt.png';
import icon_weather   from '../../../public/app-icons/weather.png';
import icon_fuel      from '../../../public/app-icons/ifuel.png';
import icon_asr       from '../../../public/app-icons/asr.png';
import icon_delay     from '../../../public/app-icons/delay.png';
import icon_loadsheet from '../../../public/app-icons/loadsheet.png';
import icon_chartfox  from '../../../public/app-icons/chartfox.png';
import icon_plane     from '../../../public/app-icons/plane.png';
import icon_home      from '../../../public/app-icons/home.png';

/** mapping ชื่อ → รูป */
const ICONS: Record<string, StaticImageData | undefined> = {
  profile: icon_profile,
  map: icon_map,
  navigraph: icon_navigraph,
  opt: icon_opt,
  weather: icon_weather,
  fuel: icon_fuel,
  asr: icon_asr,
  delay: icon_delay,
  loadsheet: icon_loadsheet,
  chartfox: icon_chartfox,
  plane: icon_plane,
  home: icon_home,
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

const JAL_RED = '#b60c18';
const DAY_TEXT = '#FFD700';
const NIGHT_TEXT = '#FFFFFF';

const BUTTONS = [
  { id: 'profile', label: 'My Profiles', icon: 'profile', href: 'https://crew.jalvirtual.com/profile', external: true },
  { id: 'map', label: 'Map', icon: 'map', href: '/map' },
  { id: 'navigraph', label: 'Navigraph', icon: 'navigraph', href: 'https://charts.navigraph.com/', external: true },
  { id: 'opt', label: 'OPT', icon: 'opt', modal: 'opt' as const },
  { id: 'metar', label: 'Metar', icon: 'weather', modal: 'metar' as const },
  { id: 'ifuel', label: 'iFuel', icon: 'fuel', modal: 'fuel' as const },
  { id: 'asr', label: 'ASR', icon: 'asr', modal: 'asr' as const },
  { id: 'delay', label: 'Delay Codes', icon: 'delay', modal: 'delay' as const },
  { id: 'loadsheet', label: 'Loadsheet', icon: 'loadsheet', modal: 'loadsheet' as const },
  { id: 'chartfox', label: 'ChartFox', icon: 'chartfox', href: '/charts' },
  { id: 'plane', label: 'Aircraft', icon: 'plane' },
  { id: 'home', label: 'Home', icon: 'home', href: '/' },
];

type LoadsheetFields = {
  date?: string;
  costIndex?: string;
  zfw?: string;
  zfwMax?: string;
  tow?: string;
  towMax?: string;
  pax?: string;
  route?: string;
};

type AcarsStatus = {
  status_text?: string;
  flight_phase?: string;
};

type ModalKey = 'settings' | 'fuel' | 'metar' | 'loadsheet' | 'asr' | 'delay' | 'opt' | null;

export default function Dashboard() {
  // UTC clock & theme
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().substr(11, 5));
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Pilot IDs & flight info
  const [pilotId, setPilotId] = useState('');
  const [simbriefId, setSimbriefId] = useState('');
  const [flight, setFlight] = useState({ dpt: '-', arr: '-' });
  const [acarsStatus, setAcarsStatus] = useState<AcarsStatus>({});

  // Loadsheet data & countdown
  const [loadsheetData, setLoadsheetData] = useState<Partial<LoadsheetFields>>({});
  const [countdown, setCountdown] = useState('');

  // Modal
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  // Animations
  const buttonTransition: Transition = { delay: 0.03, type: 'spring', stiffness: 300, damping: 15 };

  const gridAnim = {
    hidden: { opacity: 0, scale: 0.98, y: 24 },
    show: { opacity: 1, scale: 1, y: 0, transition: { stiffness: 120, damping: 16 } },
  };

  const modalAnim = {
    hidden: { opacity: 0, y: 32, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { stiffness: 170, damping: 20 } },
    exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.22 } },
  };

  // Fetch ACARS
  useEffect(() => {
    if (!pilotId) return;
    const fetchAcarsStatus = async () => {
      try {
        const response = await fetch(`https://crew.jalvirtual.com/api/acars?pilotId=${pilotId}`);
        const data = await response.json();
        setAcarsStatus(data);
      } catch {
        /* silent */
      }
    };
    fetchAcarsStatus();
    const interval = setInterval(fetchAcarsStatus, 30000);
    return () => clearInterval(interval);
  }, [pilotId]);

  // Load saved settings & theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPilotId(localStorage.getItem('pilotId') || '');
    setSimbriefId(localStorage.getItem('simbriefId') || '');
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // UTC clock tick
  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().substr(11, 5));
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
    toast(`Switched to ${next} mode`, {
      icon: next === 'dark' ? '🌙' : '☀️',
      style: {
        background: next === 'dark' ? '#1f2937' : '#fff',
        color: next === 'dark' ? NIGHT_TEXT : DAY_TEXT,
        border: `1px solid ${next === 'dark' ? '#374151' : '#e5e7eb'}`,
        boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)',
      },
    });
  };

  // SimBrief
  async function fetchSimbrief(id: string) {
    const res = await fetch(
      `https://www.simbrief.com/api/xml.fetcher.php?userid=${encodeURIComponent(id)}&json=v2`,
      { cache: 'no-store' },
    );
    return res.json();
  }

  // Update flight & loadsheet
  useEffect(() => {
    let ignore = false;
    if (!simbriefId) {
      setFlight({ dpt: '-', arr: '-' });
      setLoadsheetData({});
      return;
    }
    fetchSimbrief(simbriefId)
      .then((data) => {
        if (ignore) return;
        setFlight({
          dpt: data.origin?.icao_code || data.origin || '-',
          arr: data.destination?.icao_code || data.destination || '-',
        });
        setLoadsheetData({
          date: data.date_dep_utc || data.date,
          costIndex: data.cost_index,
          zfw: data.zfw,
          zfwMax: data.zfw_max,
          tow: data.takeoff_weight || data.tow,
          towMax: data.takeoff_max_weight || data.tow_max,
          pax: data.pax_total || data.pax_count,
          route: data.route,
        });
      })
      .catch(() => {
        if (!ignore) {
          setFlight({ dpt: '-', arr: '-' });
          setLoadsheetData({});
        }
      });
    return () => {
      ignore = true;
    };
  }, [simbriefId]);

  // Departure countdown
  useEffect(() => {
    if (!loadsheetData.date) return;
    const update = () => {
      const dep = new Date(loadsheetData.date!);
      const now = new Date();
      const diff = dep.getTime() - now.getTime();
      if (diff <= 0) setCountdown('✈️ Departed');
      else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${h}h ${m}m to dep.`);
      }
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [loadsheetData.date]);

  // Save settings
  function handleSaveSettings(p: string, s: string) {
    setPilotId(p);
    setSimbriefId(s);
    localStorage.setItem('pilotId', p);
    localStorage.setItem('simbriefId', s);
    toast.success('Settings Saved!', {
      icon: '✅',
      style: {
        background: theme === 'dark' ? '#1f2937' : '#fff',
        color: theme === 'dark' ? NIGHT_TEXT : DAY_TEXT,
        border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)',
      },
    });
  }

  /** ใช้รูปจาก mapping; ถ้าไม่มี ให้ fallback เป็น Iconify */
  const CustomIcon = ({ iconName, className = '' }: { iconName: string; className?: string }) => {
    const src = ICONS[iconName];
    if (!src) {
      return <Icon icon="mdi:image-off-outline" className={`${className} w-7 h-7 opacity-60`} />;
    }
    return (
      <Image
        src={src}
        alt={iconName}
        width={32}
        height={32}
        className={`${className} object-contain`}
        priority={false}
      />
    );
  };

  // ButtonTile
  const ButtonTile = ({
    children,
    onClick,
    href,
    external,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    href?: string;
    external?: boolean;
  }) => {
    const base =
      'relative w-full aspect-square ' +
      'min-h-[92px] sm:min-h-[108px] md:min-h-[124px] lg:min-h-[140px] ' +
      'flex flex-col items-center justify-center font-medium ' +
      'rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md border';
    const style =
      theme === 'dark'
        ? 'bg-gray-800/90 border-gray-700 hover:border-red-400/50 text-white'
        : 'bg-white/90 border-gray-200 hover:border-red-300 text-yellow-600';

    const body = (
      <div className={`${base} ${style}`}>
        {children}
      </div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={buttonTransition}
      >
        {href ? (
          <Link
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="block"
          >
            {body}
          </Link>
        ) : (
          <button type="button" onClick={onClick} className="block w-full">
            {body}
          </button>
        )}
      </motion.div>
    );
  };

  // Open modal
  const openModal = (k: ModalKey) => setActiveModal(k);

  return (
    <div
      className={`${poppins.className} relative w-full min-h-screen overflow-x-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-yellow-600'
      }`}
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20 dark:opacity-10">
        <Image
          src={bg}
          alt="JAL Background"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'jal-toast',
          duration: 2600,
          style: { fontSize: '1.1em', padding: '0.9em 1.6em', boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)' },
        }}
      />

      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <SakuraPetals />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className={`relative z-10 flex items-center justify-between w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-4 ${
          theme === 'dark' ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white/90 border-red-100 text-yellow-600'
        } backdrop-blur-sm border-b rounded-b-xl shadow-sm`}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight jal-title-shine">JAL EFB</h1>
            <span className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} text-xs font-medium`}>Electronic Flight Bag</span>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-yellow-600'
            } border text-sm font-medium shadow-inner`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            UTC {utcTime}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-yellow-600'} transition-colors`}
            aria-label="Toggle theme"
          >
            <Icon icon={theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'} className="text-xl" />
          </button>
          <button
            className={`inline-flex items-center px-3 py-1.5 ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-yellow-600'
            } border rounded-full text-sm font-medium shadow-inner hover:shadow transition-all`}
            onClick={() => setActiveModal('settings')}
          >
            <Icon icon="mdi:account-tie-hat" className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mr-2`} />
            {pilotId && pilotId !== 'JAL0000' ? pilotId : 'Set Pilot ID'}
          </button>
          <button
            onClick={() => setActiveModal('settings')}
            className="p-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
            aria-label="Settings"
          >
            <Icon icon="mdi:cog" className="text-lg" />
          </button>
        </div>
      </motion.div>

      {/* Main */}
      <div className="relative z-10 w-full px-4 sm:px-6 pt-8 pb-28">
        <div className="w-full max-w-screen-xl mx-auto">
          {/* Flight Info card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-md sm:max-w-2xl md:max-w-3xl mb-6 mx-auto"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-r from-red-600 to-red-500 text-white">
              <div className="absolute inset-0">
                <SakuraPetals />
              </div>
              <div className="relative z-10 p-5 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-wider opacity-80 mb-1">Current Flight</p>
                    <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
                      <span className="mr-3 bg-white/10 px-3 py-1 rounded-lg">{flight.dpt}</span>
                      <Icon icon="mdi:airplane" className="w-6 h-6 mx-2 rotate-90 text-white opacity-90" />
                      <span className="ml-3 bg-white/10 px-3 py-1 rounded-lg">{flight.arr}</span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-wider opacity-80 mb-1">Status</p>
                    <p className="text-lg sm:text-xl font-semibold bg-white/10 px-3 py-1 rounded-lg inline-block">
                      {acarsStatus.status_text || countdown || 'Not scheduled'}
                    </p>
                    {acarsStatus.flight_phase && (
                      <p className="text-[10px] sm:text-xs opacity-80 mt-1 bg-white/10 px-2 py-1 rounded-lg inline-block">
                        {acarsStatus.flight_phase}
                      </p>
                    )}
                  </div>
                </div>
                {loadsheetData.route && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                    <p className="text-xs sm:text-sm font-medium uppercase tracking-wider opacity-80 mb-1">Route</p>
                    <p className="font-mono text-xs bg-white/10 px-3 py-2 rounded-lg overflow-x-auto">{loadsheetData.route}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Button Grid */}
          <motion.div
            variants={gridAnim}
            initial="hidden"
            animate="show"
            className="
              grid w-full
              gap-3 sm:gap-4 md:gap-5
              [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]
            "
          >
            {BUTTONS.map((b) => {
              const iconBg = theme === 'dark' ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200';
              const commonInner = (
                <>
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl ${iconBg} mb-2 transition-colors shadow-sm shrink-0`}
                  >
                    <CustomIcon iconName={b.icon} className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-sm font-medium text-center">{b.label}</span>
                </>
              );

              if (b.modal) {
                return (
                  <ButtonTile key={b.id} onClick={() => openModal(b.modal)}>
                    {commonInner}
                  </ButtonTile>
                );
              }
              if (b.href) {
                return (
                  <ButtonTile key={b.id} href={b.href} external={b.external}>
                    {commonInner}
                  </ButtonTile>
                );
              }
              return <ButtonTile key={b.id}>{commonInner}</ButtonTile>;
            })}
          </motion.div>

          {/* Loadsheet Summary */}
          {loadsheetData.costIndex && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`w-full max-w-4xl mx-auto mt-8 ${
                theme === 'dark' ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white/90 border-gray-200 text-yellow-600'
              } backdrop-blur-sm border p-5 sm:p-6 rounded-2xl shadow-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center">
                  <Icon icon="mdi:clipboard-text" className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mr-2`} />
                  Loadsheet Summary
                </h3>
                <span className={`text-[11px] sm:text-xs px-2 py-1 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-yellow-600'} rounded-full`}>
                  SimBrief ID: {simbriefId}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <SummaryCell title="Dep UTC" value={new Date(loadsheetData.date!).toISOString().substr(11, 5)} theme={theme} />
                <SummaryCell title="Countdown" value={countdown} theme={theme} />
                <SummaryCell title="Cost Index" value={loadsheetData.costIndex} theme={theme} />
                <SummaryCell title="PAX" value={loadsheetData.pax} theme={theme} />
                <SummaryCell title="ZFW" value={`${loadsheetData.zfw} / ${loadsheetData.zfwMax} kg`} theme={theme} />
                <SummaryCell title="TOW" value={`${loadsheetData.tow} / ${loadsheetData.towMax} kg`} theme={theme} />
                <div
                  className={`col-span-1 md:col-span-2 p-3 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs font-medium mb-1`}>Route</p>
                  <p className="font-mono text-xs overflow-x-auto">{loadsheetData.route}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`fixed bottom-0 left-0 w-full py-3 ${
          theme === 'dark' ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white/90 border-gray-200 text-yellow-600'
        } backdrop-blur-sm border-t text-center text-sm tracking-wide shadow-sm`}
      >
        <div className="flex justify-center items-center space-x-4">
          <span className="flex items-center">
            <Icon icon="mdi:airplane" className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mr-1`} />
            Japan Airlines Virtual
          </span>
          <span>•</span>
          <span>EFB Developed by Y. Zhong Jie</span>
          <span>•</span>
          <span className="flex items-center">
            <Icon icon="mdi:flower" className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mr-1`} />
            v1.2.1
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal === 'settings' && (
          <motion.div key="settings" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <SettingsModal
              show
              onClose={() => setActiveModal(null)}
              onSave={handleSaveSettings}
              initialPilotId={pilotId}
              initialSimbriefId={simbriefId}
              initialHoppieId={''}
            />
          </motion.div>
        )}

        {activeModal === 'fuel' && (
          <motion.div key="fuel" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <IFuelModal
              show
              onClose={() => setActiveModal(null)}
              onConfirm={async () => {
                toast.success('Fuel Request Sent!', {
                  icon: '⛽',
                  style: {
                    background: theme === 'dark' ? '#1f2937' : '#fff',
                    color: theme === 'dark' ? NIGHT_TEXT : DAY_TEXT,
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)',
                  },
                });
                return 'Fuel Request Sent!';
              }}
            />
          </motion.div>
        )}

        {activeModal === 'metar' && (
          <motion.div key="metar" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <WeatherModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {activeModal === 'loadsheet' && (
          <motion.div key="loadsheet" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <LoadsheetModal
              show
              onClose={() => setActiveModal(null)}
              onAutofill={fetchSimbrief}
              hoppieId={pilotId}
              simbriefId={simbriefId}
              onSubmit={async () => {
                toast.success('Loadsheet Sent!', {
                  icon: '📦',
                  style: {
                    background: theme === 'dark' ? '#1f2937' : '#fff',
                    color: theme === 'dark' ? NIGHT_TEXT : DAY_TEXT,
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)',
                  },
                });
                return 'Loadsheet Sent!';
              }}
            />
          </motion.div>
        )}

        {activeModal === 'asr' && (
          <motion.div key="asr" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <ASRModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {activeModal === 'delay' && (
          <motion.div key="delay" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <DelayCodeModal show onClose={() => setActiveModal(null)} />
          </motion.div>
        )}

        {activeModal === 'opt' && (
          <motion.div key="opt" variants={modalAnim} initial="hidden" animate="show" exit="exit" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <OPTModal
              show
              onClose={() => setActiveModal(null)}
              onAutofill={fetchSimbrief}
              hoppieId={pilotId}
              simbriefId={simbriefId}
              onSubmit={async () => {
                toast.success('OPT Sent!', {
                  icon: '📈',
                  style: {
                    background: theme === 'dark' ? '#1f2937' : '#fff',
                    color: theme === 'dark' ? NIGHT_TEXT : DAY_TEXT,
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    boxShadow: '0 4px 20px rgba(182, 12, 24, 0.15)',
                  },
                });
                return 'OPT Sent!';
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style jsx global>{`
        html,
        body,
        #__next {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .jal-title-shine {
          background: linear-gradient(90deg, ${JAL_RED} 0%, #ea4256 50%, ${JAL_RED} 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 4s ease-in-out infinite alternate;
        }
        .jal-toast { backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
}

function SummaryCell({ title, value, theme }: { title: string; value?: React.ReactNode; theme: 'light' | 'dark' }) {
  return (
    <div className={`p-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs font-medium mb-1`}>{title}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
