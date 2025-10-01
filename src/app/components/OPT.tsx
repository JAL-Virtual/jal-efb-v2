'use client';
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';
import { Icon } from '@iconify/react';

// --- Utility functions ---
function toTonnes(val: string | number) {
  const n = Number(val);
  return isNaN(n) ? '' : (n / 1000).toFixed(1);
}
function formatDateDMY(str: string) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return d && m && y ? `${d}/${m}/${y}` : str;
}
function formatTimeHM(str: string) {
  if (!str) return '';
  const [h, m] = str.split(':');
  return h && m ? `${h}:${m}` : str;
}
function formatSidStar(sid: string, trans: string) {
  return sid ? `${sid}${trans ? ` (${trans})` : ''}` : '';
}
function parseIsoToDateTime(str: string) {
  if (!str) return { date: '', time: '' };
  const [datePart, timePartRaw] = str.split('T');
  if (!datePart || !timePartRaw) return { date: '', time: '' };
  const [year, month, day] = datePart.split('-');
  const [hour, min] = timePartRaw.split(':');
  return {
    date: day && month && year ? `${day}/${month}/${year}` : '',
    time: hour && min ? `${hour}:${min}` : '',
  };
}

// --- Types ---
type LoadsheetFields = {
  alignments: string;
  callsign: string;
  flightDate: string;
  depTime: string;
  flightTime: string;
  reg: string;
  sid: string;
  sidTrans: string;
  star: string;
  starTrans: string;
  depRunway: string;
  arrRunway: string;
  costIndex: string;
  estZfw: string;
  maxZfw: string;
  estTow: string;
  maxTow: string;
  estLdw: string;
  maxLdw: string;
  pax: string;
  cargo: string;
  dow: string;
  crewCockpit: string;
  crewCabin: string;
  crewTotal: string;
  pic: string;
  route: string;
  depMetar: string;
  depTaf: string;
  arrMetar: string;
  arrTaf: string;
  originIcao?: string;
  destinationIcao?: string;
};

const defaultFields: LoadsheetFields = {
  alignments: '',
  callsign: '',
  flightDate: '',
  depTime: '',
  flightTime: '',
  reg: '',
  sid: '',
  sidTrans: '',
  star: '',
  starTrans: '',
  depRunway: '',
  arrRunway: '',
  costIndex: '',
  estZfw: '',
  maxZfw: '',
  estTow: '',
  maxTow: '',
  estLdw: '',
  maxLdw: '',
  pax: '',
  cargo: '',
  dow: '',
  crewCockpit: '',
  crewCabin: '',
  crewTotal: '',
  pic: '',
  route: '',
  depMetar: '',
  depTaf: '',
  arrMetar: '',
  arrTaf: '',
  originIcao: '',
  destinationIcao: '',
};

type Props = {
  show: boolean;
  onClose: () => void;
  onAutofill: (simbriefId: string) => Promise<any>;
  simbriefId: string;
  vatsimLink?: string;
  ivaoLink?: string;
  loading?: boolean;
  hoppieId: string;
  initialFields?: Partial<LoadsheetFields>;
  onSubmit?: (fields: any) => Promise<string>;
};

export default function LoadsheetModal({
  show,
  onClose,
  onAutofill,
  simbriefId,
  loading = false,
  initialFields = {},
  onSubmit, // (ยังไม่ได้ใช้ในบล็อกนี้)
}: Props) {
  const [fields, setFields] = useState<LoadsheetFields>({ ...defaultFields, ...initialFields });
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [highlight, setHighlight] = useState(false);

  // ใช้ตัวนี้เป็น SimBrief ID ที่ “ใช้งานจริง” (prop ถ้ามี > DB > ว่าง)
  const [effectiveSimbriefId, setEffectiveSimbriefId] = useState<string>(simbriefId || '');
  const [loadingSimbriefFromDb, setLoadingSimbriefFromDb] = useState(false);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Highlight auto-reset
  useEffect(() => {
    if (highlight) {
      const t = setTimeout(() => setHighlight(false), 1600);
      return () => clearTimeout(t);
    }
  }, [highlight]);

  // sync เมื่อ prop simbriefId เปลี่ยน
  useEffect(() => {
    setEffectiveSimbriefId(simbriefId || '');
  }, [simbriefId]);

  // Auto-sync SimBrief data when modal opens
  useEffect(() => {
    if (show && effectiveSimbriefId) {
      handleAutofill();
    }
  }, [show, effectiveSimbriefId]);

  // โหลด SimBrief ID จาก DB เมื่อเปิด modal และกรณี prop ว่าง
  useEffect(() => {
    if (!show) return;
    if (simbriefId && simbriefId.trim() !== '') return; // มี prop แล้ว ไม่ต้องโหลด DB

    let pilotId = '';
    try {
      if (typeof window !== 'undefined') {
        pilotId = (localStorage.getItem('pilotId') || '').toUpperCase().trim();
      }
    } catch {
      // ignore
    }
    if (!pilotId) return;

    const fetchSimbriefFromDB = async () => {
      try {
        setLoadingSimbriefFromDb(true);
        const res = await fetch(`/api/user-settings?pilotId=${encodeURIComponent(pilotId)}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (res.ok && json?.data) {
          const sbid = (json.data.simbriefId || '').toString();
          if (sbid && !effectiveSimbriefId) {
            setEffectiveSimbriefId(sbid);
            setToast({ message: `Loaded SimBrief ID: ${sbid}`, success: true });
          }
        }
      } catch {
        // ไม่ให้ UX พัง
      } finally {
        setLoadingSimbriefFromDb(false);
      }
    };

    void fetchSimbriefFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  async function handleAutofill() {
    setIsLoading(true);
    setToast(null);
    try {
      const sbid = (effectiveSimbriefId || '').trim();
      if (!sbid) throw new Error('SimBrief ID is not set!');
      const sb = await onAutofill(sbid);

      const isoDep =
        sb.general?.sched_out ||
        sb.general?.date_time_out ||
        sb.times?.sched_out ||
        '';

      const parsed = parseIsoToDateTime(isoDep);

      setFields({
        alignments: `${sb.general.icao_airline || ''}${sb.general.flight_number || ''}`,
        callsign: `${sb.general.icao_airline || ''}${sb.general.flight_number || ''}${sb.general.day_of_flight ? '/' + sb.general.day_of_flight : ''}`,
        flightDate: parsed.date || (sb.general.date ? formatDateDMY(sb.general.date) : ''),
        depTime: parsed.time || (sb.times?.sched_out ? formatTimeHM(sb.times.sched_out) : ''),
        flightTime: sb.times?.est_time_enroute ? `${formatTimeHM(sb.times.est_time_enroute)} Hrs` : '',
        reg: sb.api_params?.reg || '',
        sid: sb.general.sid_ident || '',
        sidTrans: sb.general.sid_trans || '',
        star: sb.general.star_ident || '',
        starTrans: sb.general.star_trans || '',
        depRunway: sb.origin?.plan_rwy || '',
        arrRunway: sb.destination?.plan_rwy || '',
        costIndex: sb.general?.costindex?.toString() || '',
        estZfw: toTonnes(sb.weights?.est_zfw),
        maxZfw: toTonnes(sb.weights?.max_zfw),
        estTow: toTonnes(sb.weights?.est_tow),
        maxTow: toTonnes(sb.weights?.max_tow),
        estLdw: toTonnes(sb.weights?.est_ldw),
        maxLdw: toTonnes(sb.weights?.max_ldw),
        pax: sb.weights?.pax_count?.toString() || '',
        cargo: toTonnes(sb.weights?.cargo),
        dow: toTonnes(sb.weights?.oew),
        crewCockpit: sb.crew?.cockpit || '',
        crewCabin: sb.crew?.cabin || '',
        crewTotal: sb.crew?.total || '',
        pic: sb.api_params?.cpt || '',
        route: sb.general?.route || '',
        depMetar: sb.origin?.metar || '',
        depTaf: sb.origin?.taf || '',
        arrMetar: sb.destination?.metar || '',
        arrTaf: sb.destination?.taf || '',
        originIcao: sb.origin?.icao_code || '',
        destinationIcao: sb.destination?.icao_code || '',
      });
      setToast({ message: 'Autofilled from SimBrief', success: true });
      setHighlight(true);
    } catch (e: any) {
      setToast({ message: e?.message || 'Could not fetch SimBrief data', success: false });
    }
    setIsLoading(false);
  }

  const canAutofill = !!(effectiveSimbriefId && effectiveSimbriefId.trim() !== '');

  if (!show) return null;
  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />

      {/* Toast Notification (iOS style) */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-5 py-3 rounded-lg flex items-center gap-2 font-medium text-sm transition-all duration-300 shadow-lg
            ${toast.success
              ? 'bg-[#34C759] text-white'
              : 'bg-[#FF3B30] text-white'}
          `}
          style={{ animation: 'fadeInUp 0.3s cubic-bezier(.24,1.44,.56,1)' }}
        >
          <Icon icon={toast.success ? 'mdi:check-circle' : 'mdi:alert-circle'} className="text-lg" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-[#007AFF] mr-3">
              <Icon icon="mdi:clipboard-list" className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loadsheet</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{fields.alignments}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-4">
          {/* Flight Information Grid */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 transition-all ${highlight ? 'animate-glow' : ''}`}
          >
            <InfoBox label="Origin" value={fields.originIcao} />
            <InfoBox label="Destination" value={fields.destinationIcao} />
            <InfoBox label="PIC" value={fields.pic} />
            <InfoBox label="Date" value={fields.flightDate} />
            <InfoBox label="Dep Time (Z)" value={fields.depTime} />
            <InfoBox label="Flight Time" value={fields.flightTime} />
            <InfoBox label="Registration" value={fields.reg} />
            <InfoBox label="Cost Index" value={fields.costIndex} />
            <InfoBox label="SID (Departure)" value={formatSidStar(fields.sid, fields.sidTrans)} />
            <InfoBox label="STAR (Arrival)" value={formatSidStar(fields.star, fields.starTrans)} />
            <InfoBox label="Runways" value={`${fields.depRunway} / ${fields.arrRunway}`} />
            <InfoBox label="ZFW (T)" value={`${fields.estZfw} / ${fields.maxZfw}`} />
            <InfoBox label="TOW (T)" value={`${fields.estTow} / ${fields.maxTow}`} />
            <InfoBox label="LDW (T)" value={`${fields.estLdw} / ${fields.maxLdw}`} />
            <InfoBox label="Cargo (T)" value={fields.cargo} />
            <InfoBox label="Passengers" value={fields.pax} />
          </div>

          {/* Route Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">Route</h3>
              {effectiveSimbriefId && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  SimBrief ID: <b>{effectiveSimbriefId}</b>
                </span>
              )}
            </div>
            <div className="rounded-xl bg-gray-100 dark:bg-[#2C2C2E] p-4 text-gray-900 dark:text-white text-sm whitespace-pre-line break-words">
              {fields.route || '-'}
            </div>
          </div>

          {/* Weather Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Departure Weather</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">METAR</h4>
                  <div className="rounded-lg bg-gray-100 dark:bg-[#2C2C2E] p-3 text-xs text-gray-900 dark:text-white break-words">
                    {fields.depMetar || '-'}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TAF</h4>
                  <div className="rounded-lg bg-gray-100 dark:bg-[#2C2C2E] p-3 text-xs text-gray-900 dark:text-white break-words">
                    {fields.depTaf || '-'}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Arrival Weather</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">METAR</h4>
                  <div className="rounded-lg bg-gray-100 dark:bg-[#2C2C2E] p-3 text-xs text-gray-900 dark:text-white break-words">
                    {fields.arrMetar || '-'}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TAF</h4>
                  <div className="rounded-lg bg-gray-100 dark:bg-[#2C2C2E] p-3 text-xs text-gray-900 dark:text-white break-words">
                    {fields.arrTaf || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#2C2C2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Icon icon="line-md:loading-twotone-loop" className="text-lg animate-spin text-[#007AFF]" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Syncing with SimBrief...</span>
              </>
            ) : effectiveSimbriefId ? (
              <>
                <Icon icon="mdi:check-circle" className="text-lg text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  SimBrief Connected (ID: {effectiveSimbriefId})
                </span>
              </>
            ) : (
              <>
                <Icon icon="mdi:alert-circle" className="text-lg text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">No SimBrief ID configured</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(32px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes glow-pop {
          0% { background-color: rgba(0, 122, 255, 0); }
          50% { background-color: rgba(0, 122, 255, 0.1); }
          100% { background-color: rgba(0, 122, 255, 0); }
        }
        .animate-glow { animation: glow-pop 1.2s ease-in-out 1; }
      `}</style>
    </Modal>
  );
}

// InfoBox component
function InfoBox({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col rounded-xl bg-gray-50 dark:bg-[#2C2C2E] p-3">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || '-'}</span>
    </div>
  );
}
