'use client';
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Icon } from '@iconify/react';
import { useCookies } from 'react-cookie';
import { SketchPicker } from 'react-color';

/** ──────────────────────────────────────────────────────────────────────────
 *  🔴 You asked to hardcode the Ops webhook in the component
 *  (Consider moving to /api proxy later to avoid exposing the URL to clients)
 *  ────────────────────────────────────────────────────────────────────────── */
const OPS_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1415642019677732874/Ty2ZNpOJu3bXQKEyqHLV4GCxFg4VdmfqJECIFT8enw5xyBt0-QEcUkZUc3lqCNSwqLZ8';

/* ─────────────── Utility functions ─────────────── */
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
  return { date: day && month && year ? `${day}/${month}/${year}` : '', time: hour && min ? `${hour}:${min}` : '' };
}
function buildHoppiesPacket(fields: LoadsheetFields) {
  return `LOADSHEET/${fields.alignments}
DEP:${fields.originIcao} ARR:${fields.destinationIcao}
PIC:${fields.pic}
DATE:${fields.flightDate}
DEP TIME:${fields.depTime}
FLT TIME:${fields.flightTime}
REG:${fields.reg}
COST INDEX:${fields.costIndex}
SID:${formatSidStar(fields.sid, fields.sidTrans)}
STAR:${formatSidStar(fields.star, fields.starTrans)}
PLAN RWY:${fields.depRunway}/${fields.arrRunway}
ZFW/MAX:${fields.estZfw}/${fields.maxZfw}
TOW/MAX:${fields.estTow}/${fields.maxTow}
LAW/MAX:${fields.estLdw}/${fields.maxLdw}
CARGO:${fields.cargo}
PAX:${fields.pax}
ROUTE:${fields.route}`;
}

/* ─────────────── Types ─────────────── */
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

type NotepadData = { text: string; drawings: string[] };

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
  simbriefId: string; // still accepted; will use DB if empty
  loading?: boolean;
  hoppieId: string;
  initialFields?: Partial<LoadsheetFields>;
  onSubmit?: (fields: any) => Promise<string>;
};

const LoadsheetModal = ({
  show,
  onClose,
  onAutofill,
  simbriefId,
  loading = false,
  initialFields = {},
  hoppieId,
}: Props) => {
  const [fields, setFields] = useState<LoadsheetFields>({ ...defaultFields, ...initialFields });
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [isOpsSending, setIsOpsSending] = useState(false);
  const [highlight, setHighlight] = useState(false);

  // SimBrief ID resolution
  const [effectiveSimbriefId, setEffectiveSimbriefId] = useState<string>(simbriefId || '');
  const [loadingSimbriefFromDb, setLoadingSimbriefFromDb] = useState(false);

  // Live WX (NOTAMs removed)
  const [wxRefreshing, setWxRefreshing] = useState(false);

  // NOTOC editor (for printing & ops)
  const [notoc, setNotoc] = useState<{ unid: string; class: string; qty: string; remarks?: string }[]>([]);

  // SIGWX & RNP mini-panel
  const [rnp, setRnp] = useState('0.3');
  const [sigwx, setSigwx] = useState('');
  const [sendingAcars, setSendingAcars] = useState(false);

  // cookies
  const [cookies, setCookie] = useCookies(['loadsheetNotepad']);
  const [notepadData, setNotepadData] = useState<NotepadData>({ text: '', drawings: [] });

  // notepad & drawing
  const [activeTab, setActiveTab] = useState<'notes' | 'draw'>('notes');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  /* ───────────── Sync simbriefId prop ───────────── */
  useEffect(() => {
    setEffectiveSimbriefId(simbriefId || '');
  }, [simbriefId]);

  /* ───────────── Load SimBrief ID from DB when needed ───────────── */
  useEffect(() => {
    if (!show) return;
    if (simbriefId && simbriefId.trim() !== '') return;

    let pid = '';
    try {
      if (typeof window !== 'undefined') {
        pid = (localStorage.getItem('pilotId') || '').toUpperCase().trim();
      }
    } catch {
      // ignore
    }
    if (!pid) return;

    const fetchFromDb = async () => {
      try {
        setLoadingSimbriefFromDb(true);
        const res = await fetch(`/api/user-settings?pilotId=${encodeURIComponent(pid)}`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json?.data) {
          const sbid = (json.data.simbriefId || '').toString();
          if (!effectiveSimbriefId && sbid) setEffectiveSimbriefId(sbid);
        }
      } catch {
        // silent
      } finally {
        setLoadingSimbriefFromDb(false);
      }
    };

    void fetchFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  /* ───────────── Cookies load/save ───────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = cookies.loadsheetNotepad;
    if (saved) setNotepadData(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
    setCookie('loadsheetNotepad', notepadData, {
      path: '/',
      expires,
      sameSite: 'lax',
      secure: typeof location !== 'undefined' ? location.protocol === 'https:' : false,
    });
  }, [notepadData, setCookie]);

  /* ───────────── Canvas DPR + redraw ───────────── */
  useEffect(() => {
    if (activeTab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const setup = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawCanvas();
    };

    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeTab, notepadData.drawings.length]);

  function redrawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    notepadData.drawings.forEach((drawing) => {
      const img = new Image();
      img.src = drawing;
      img.onload = () => ctx.drawImage(img, 0, 0);
    });
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotepadData((prev) => ({ ...prev, text: e.target.value }));
  }

  function getPointerPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const me = e as React.MouseEvent<HTMLCanvasElement>;
    return { x: me.nativeEvent.offsetX, y: me.nativeEvent.offsetY };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    if ('touches' in e) e.preventDefault();

    const { x, y } = getPointerPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('touches' in e) e.preventDefault();
    const { x, y } = getPointerPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setNotepadData((prev) => ({ ...prev, drawings: [...prev.drawings, dataUrl] }));
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setNotepadData((prev) => ({ ...prev, drawings: [] }));
  }

  function resetNotepad() {
    setNotepadData({ text: '', drawings: [] });
  }

  /* ───────────── Autofill from SimBrief ───────────── */
  async function handleAutofill() {
    setIsLoading(true);
    setFeedback(null);
    try {
      const sbid = (effectiveSimbriefId || '').trim();
      if (!sbid) throw new Error('SimBrief ID is not set!');
      const sb = await onAutofill(sbid);

      const isoDep = sb.general?.sched_out || sb.general?.date_time_out || sb.times?.sched_out || '';
      const parsed = parseIsoToDateTime(isoDep);

      setFields({
        alignments: `${sb.general.icao_airline || ''}${sb.general.flight_number || ''}`,
        callsign: `${sb.general.icao_airline || ''}${sb.general.flight_number || ''}${
          sb.general.day_of_flight ? '/' + sb.general.day_of_flight : ''
        }`,
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
      setFeedback({ message: 'Autofilled from SimBrief', type: 'success' });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch (e: any) {
      setFeedback({ message: e?.message || 'Could not fetch SimBrief data', type: 'error' });
    }
    setIsLoading(false);
  }

  /* ───────────── Live WX refresh (NOTAMs removed) ───────────── */
  async function refreshWx() {
    if (!fields.originIcao && !fields.destinationIcao) return;
    setWxRefreshing(true);
    try {
      const stations = [fields.originIcao, fields.destinationIcao].filter(Boolean).join(',');
      if (stations) {
        const wxRes = await fetch(`/api/weather?icaos=${encodeURIComponent(stations)}`, { cache: 'no-store' });
        if (wxRes.ok) {
          const j = await wxRes.json();
          const metars = j?.metar?.data?.METAR ?? [];
          const tafs = j?.taf?.data?.TAF ?? [];
          const pickMetar = (icao: string) =>
            metars.find((m: any) => (m.station_id || m.station || '').toUpperCase() === icao)?.raw_text;
          const pickTaf = (icao: string) =>
            tafs.find((t: any) => (t.station_id || t.station || '').toUpperCase() === icao)?.raw_text;
          setFields((prev) => ({
            ...prev,
            depMetar: pickMetar((fields.originIcao || '').toUpperCase()) || prev.depMetar,
            arrMetar: pickMetar((fields.destinationIcao || '').toUpperCase()) || prev.arrMetar,
            depTaf: pickTaf((fields.originIcao || '').toUpperCase()) || prev.depTaf,
            arrTaf: pickTaf((fields.destinationIcao || '').toUpperCase()) || prev.arrTaf,
          }));
        }
      }
      setFeedback({ message: 'WX refreshed', type: 'success' });
    } catch {
      setFeedback({ message: 'WX refresh failed (API not present?)', type: 'error' });
    } finally {
      setWxRefreshing(false);
    }
  }

  /* ───────────── Send to Ops (Discord) ───────────── */
  async function handleSendToOpsDiscord() {
    setIsOpsSending(true);
    setFeedback(null);

    const embed = {
      title: `🟡 Loadsheet Info`,
      color: 0x5865f2,
      fields: [
        { name: '🟡 Callsign', value: `\`${fields.alignments || '-'}\``, inline: true },
        { name: '🗓️ Date', value: `\`${fields.flightDate || '-'}\``, inline: true },
        { name: '👨‍✈️ PIC', value: `\`${fields.pic || '-'}\``, inline: true },
        { name: '✈️ Aircraft', value: `\`${fields.reg || '-'}\``, inline: true },
        { name: 'Origin', value: `\`${fields.originIcao || '-'}\``, inline: true },
        { name: 'Destination', value: `\`${fields.destinationIcao || '-'}\``, inline: true },
        { name: 'DEP RWY', value: `\`${fields.depRunway || '-'}\``, inline: true },
        { name: 'ARR RWY', value: `\`${fields.arrRunway || '-'}\``, inline: true },
        { name: 'Cost Index', value: `\`${fields.costIndex || '-'}\``, inline: true },
        { name: 'ZFW / MAX', value: `\`${(fields.estZfw || '-') + ' / ' + (fields.maxZfw || '-')}\``, inline: true },
        { name: 'TOW / MAX', value: `\`${(fields.estTow || '-') + ' / ' + (fields.maxTow || '-')}\``, inline: true },
        { name: 'LDW / MAX', value: `\`${(fields.estLdw || '-') + ' / ' + (fields.maxLdw || '-')}\``, inline: true },
        { name: 'PAX', value: `\`${fields.pax || '-'}\``, inline: true },
        { name: 'Cargo', value: `\`${fields.cargo || '-'}\``, inline: true },
        { name: 'SID (DEP)', value: `\`${fields.sid || '-'}\``, inline: true },
        { name: 'STAR (ARR)', value: `\`${fields.star || '-'}\``, inline: true },
        { name: 'DEP TIME (Z)', value: `\`${fields.depTime || '-'}\``, inline: true },
        { name: 'FLT TIME', value: `\`${fields.flightTime || '-'}\``, inline: true },
        {
          name: '🧭 Route',
          value: fields.route ? `\`\`\`fix\n${fields.route.slice(0, 1950)}\n\`\`\`` : '`-`',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Ops Dispatch • EFB' },
    };

    try {
      const resp = await fetch(OPS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'EFB • Operations', embeds: [embed] }),
      });

      if (resp.status === 204 || resp.ok) {
        setFeedback({ message: 'Loadsheet sent to Operations (Discord)', type: 'success' });
      } else {
        const text = await resp.text().catch(() => '');
        throw new Error(`Ops notify failed (${resp.status}) ${text ? `- ${text}` : ''}`);
      }
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Failed to notify Operations (Discord)', type: 'error' });
    } finally {
      setIsOpsSending(false);
    }
  }

  /* ───────────── Send SIGWX & RNP via Hoppie ───────────── */
  async function sendSigwxRnpToAcars() {
    if (!fields.alignments) {
      setFeedback({ message: 'No callsign (alignments) to send ACARS', type: 'error' });
      return;
    }
    setSendingAcars(true);
    try {
      const packet = encodeURIComponent(`OPS/RNP:${rnp}\nSIGWX:${sigwx || 'NIL'}`);
      const url = `http://www.hoppie.nl/acars/system/connect.html?logon=${encodeURIComponent(
        hoppieId,
      )}&from=EFB&to=${encodeURIComponent(fields.alignments)}&type=telex&packet=${packet}`;
      await fetch(url);
      setFeedback({ message: 'SIGWX & RNP sent via ACARS', type: 'success' });
    } catch {
      setFeedback({ message: 'Failed to send SIGWX & RNP via ACARS', type: 'error' });
    } finally {
      setSendingAcars(false);
    }
  }

  /* ───────────── Send to Hoppie (Loadsheet packet) ───────────── */
  async function handleSendToHoppies() {
    if (!fields.alignments) {
      setFeedback({ message: 'Simbrief data Not Found', type: 'error' });
      return;
    }
    const callsign = fields.alignments || '';
    const packet = encodeURIComponent(buildHoppiesPacket(fields));
    const url = `http://www.hoppie.nl/acars/system/connect.html?logon=${encodeURIComponent(
      hoppieId,
    )}&from=AMX&to=${encodeURIComponent(callsign)}&type=telex&packet=${packet}`;
    try {
      await fetch(url);
      setFeedback({ message: 'Successfully sent to Hoppie', type: 'success' });
    } catch {
      setFeedback({ message: 'Failed to send to Hoppie', type: 'error' });
    }
  }

  /* ───────────── Print loadsheet (incl. NOTOC) ───────────── */
  function printLoadsheet() {
    const el = document.getElementById('printable-loadsheet');
    if (!el) return;
    const w = window.open('', 'PRINT', 'height=900,width=750');
    if (!w) return;
    w.document.write(`<html><head><title>Loadsheet</title>
      <style>
        body{font-family: system-ui,-apple-system,Segoe UI,Roboto; color:#111;margin:24px}
        h2{margin:0 0 8px 0}
        table{width:100%; border-collapse:collapse; font-size:12px}
        td,th{border:1px solid #bbb; padding:6px; vertical-align:top}
        .muted{color:#666; font-size:11px}
        .k{font-weight:600}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .mono{font-family: ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  /* ───────────── Small helpers ───────────── */
  function addNotoc() {
    setNotoc((prev) => [...prev, { unid: '', class: '', qty: '1' }]);
  }
  function removeNotoc(i: number) {
    setNotoc((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Hidden number input spinners
  const hideSpinnerStyles = `
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="number"] { -moz-appearance: textfield; }
  `;
  const canAutofill = !!(effectiveSimbriefId && effectiveSimbriefId.trim() !== '');

  /* ───────────── UI ───────────── */
  return (
    <Modal onClose={onClose} wide>
      <style>{hideSpinnerStyles}</style>

      <div className="relative w-full max-w-7xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icon icon="mdi:clipboard-text" width={24} className="text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">Flight Loadsheet</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <Icon icon="mdi:close" width={24} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="flex h-[600px] overflow-hidden">
          {/* Loadsheet Content Area */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-4 border-r border-gray-700">
            <div id="printable-loadsheet">
              {/* Flight Info Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="mdi:airplane" width={20} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Flight Info</h3>
                    <p className="text-xs text-gray-400">General details</p>
                  </div>
                </div>
                <div className={`grid grid-cols-2 gap-3 ${highlight ? 'animate-pulse' : ''}`}>
                  <CompactInfoBox label="Flight" value={fields.alignments} />
                  <CompactInfoBox label="Registration" value={fields.reg} />
                  <CompactInfoBox label="Date" value={fields.flightDate} />
                  <CompactInfoBox label="Dep Time" value={fields.depTime} />
                  <CompactInfoBox label="Flight Time" value={fields.flightTime} />
                  <CompactInfoBox label="PIC" value={fields.pic} />
                  <CompactInfoBox label="Cockpit Crew" value={fields.crewCockpit} />
                  <CompactInfoBox label="Cabin Crew" value={fields.crewCabin} />
                  <CompactInfoBox label="Total Crew" value={fields.crewTotal} />
                </div>
              </div>

              {/* Navigation Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="mdi:map-marker-path" width={20} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Navigation</h3>
                    <p className="text-xs text-gray-400">Route and procedures</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CompactInfoBox label="Origin" value={fields.originIcao} />
                  <CompactInfoBox label="Destination" value={fields.destinationIcao} />
                  <CompactInfoBox label="SID" value={formatSidStar(fields.sid, fields.sidTrans)} />
                  <CompactInfoBox label="STAR" value={formatSidStar(fields.star, fields.starTrans)} />
                  <CompactInfoBox label="Dep RWY" value={fields.depRunway} />
                  <CompactInfoBox label="Arr RWY" value={fields.arrRunway} />
                  <CompactInfoBox label="Cost Index" value={fields.costIndex} />
                </div>
              </div>

              {/* Weights Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon icon="mdi:weight-kilogram" width={20} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Weights (tonnes)</h3>
                    <p className="text-xs text-gray-400">Weight and balance</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CompactInfoBox label="ZFW" value={`${fields.estZfw} / ${fields.maxZfw}`} />
                  <CompactInfoBox label="TOW" value={`${fields.estTow} / ${fields.maxTow}`} />
                  <CompactInfoBox label="LDW" value={`${fields.estLdw} / ${fields.maxLdw}`} />
                  <CompactInfoBox label="Cargo" value={fields.cargo} />
                  <CompactInfoBox label="Passengers" value={fields.pax} />
                  <CompactInfoBox label="DOW" value={fields.dow} />
                </div>
              </div>

              {/* Route Section */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon icon="mdi:route" width={20} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Route</h3>
                    <p className="text-xs text-gray-400">Flight planned route</p>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-800 border border-gray-700 p-3 text-sm text-gray-200 font-mono whitespace-pre-line break-words">
                  {fields.route || 'No route specified'}
                </div>
              </div>

              {/* Weather (NOTAMs removed) */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon icon="mdi:weather-cloudy" width={20} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Weather</h3>
                      <p className="text-xs text-gray-400">Live METAR/TAF</p>
                    </div>
                  </div>
                  <button
                    onClick={refreshWx}
                    disabled={wxRefreshing}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      wxRefreshing ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {wxRefreshing ? 'Refreshing…' : 'Refresh WX'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-md font-medium text-white mb-1">Departure ({fields.originIcao || '-'})</h4>
                    <div className="space-y-1">
                      <div>
                        <div className="text-xs font-medium text-gray-300 mb-0.5">METAR</div>
                        <div className="rounded-lg bg-gray-800 border border-gray-700 p-2 text-xs text-gray-200 font-mono break-words">
                          {fields.depMetar || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-300 mb-0.5">TAF</div>
                        <div className="rounded-lg bg-gray-800 border border-gray-700 p-2 text-xs text-gray-200 font-mono break-words">
                          {fields.depTaf || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-white mb-1">Arrival ({fields.destinationIcao || '-'})</h4>
                    <div className="space-y-1">
                      <div>
                        <div className="text-xs font-medium text-gray-300 mb-0.5">METAR</div>
                        <div className="rounded-lg bg-gray-800 border border-gray-700 p-2 text-xs text-gray-200 font-mono break-words">
                          {fields.arrMetar || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-300 mb-0.5">TAF</div>
                        <div className="rounded-lg bg-gray-800 border border-gray-700 p-2 text-xs text-gray-200 font-mono break-words">
                          {fields.arrTaf || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SIGWX & RNP (ACARS) */}
              <div className="mb-4">
                <div className="rounded-xl bg-gray-800 border border-gray-700 p-3 text-sm text-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:weather-cloudy-alert" />
                    <span className="font-medium">SIGWX &amp; RNP (via ACARS)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">RNP</label>
                      <input
                        className="w-full bg-gray-700 rounded px-2 py-1"
                        value={rnp}
                        onChange={(e) => setRnp(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400">SIGWX Summary</label>
                      <textarea
                        className="w-full bg-gray-700 rounded px-2 py-1"
                        rows={3}
                        value={sigwx}
                        onChange={(e) => setSigwx(e.target.value)}
                        placeholder="ISOL TS NW OF ROUTE FL300-380; MOD ICE FL180-240"
                      />
                    </div>
                  </div>
                  <button
                    disabled={sendingAcars}
                    onClick={sendSigwxRnpToAcars}
                    className={`mt-2 px-3 py-1.5 rounded-lg ${
                      sendingAcars ? 'bg-gray-700 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {sendingAcars ? 'Sending…' : `Send to ${fields.alignments || 'ACFT'}`}
                  </button>
                </div>
              </div>

              {/* NOTOC (Dangerous Goods) */}
              <div className="mb-2">
                <div className="text-sm font-semibold text-white mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:hazard-lights" />
                    NOTOC (Dangerous Goods)
                  </div>
                  <button
                    onClick={addNotoc}
                    className="px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs"
                    type="button"
                  >
                    Add Item
                  </button>
                </div>
                <div className="w-full overflow-auto rounded-lg border border-gray-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="text-left p-2">UN/ID</th>
                        <th className="text-left p-2">Class</th>
                        <th className="text-left p-2">Qty</th>
                        <th className="text-left p-2">Remarks</th>
                        <th className="p-2">—</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notoc.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-400">
                            No dangerous goods declared
                          </td>
                        </tr>
                      ) : (
                        notoc.map((n, i) => (
                          <tr key={i} className="border-t border-gray-800">
                            <td className="p-2">
                              <input
                                value={n.unid}
                                onChange={(e) => {
                                  const c = [...notoc];
                                  c[i].unid = e.target.value;
                                  setNotoc(c);
                                }}
                                className="w-full bg-transparent border-b border-gray-600"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={n.class}
                                onChange={(e) => {
                                  const c = [...notoc];
                                  c[i].class = e.target.value;
                                  setNotoc(c);
                                }}
                                className="w-full bg-transparent border-b border-gray-600"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={n.qty}
                                onChange={(e) => {
                                  const c = [...notoc];
                                  c[i].qty = e.target.value;
                                  setNotoc(c);
                                }}
                                className="w-full bg-transparent border-b border-gray-600"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={n.remarks || ''}
                                onChange={(e) => {
                                  const c = [...notoc];
                                  c[i].remarks = e.target.value;
                                  setNotoc(c);
                                }}
                                className="w-full bg-transparent border-b border-gray-600"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeNotoc(i)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* /printable-loadsheet */}
          </div>

          {/* Notepad Area */}
          <div className="w-[420px] bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Notepad Header */}
            <div className="sticky top-0 z-10 bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:notebook" width={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Flight Notepad</h3>
              </div>
              <button onClick={resetNotepad} className="text-sm text-gray-400 hover:text-white flex items-center space-x-1">
                <Icon icon="mdi:refresh" width={16} />
                <span>Reset</span>
              </button>
            </div>

            {/* Notepad Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2 text-center font-medium ${
                  activeTab === 'notes' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab('draw')}
                className={`flex-1 py-2 text-center font-medium ${
                  activeTab === 'draw' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Draw
              </button>
            </div>

            {/* Notepad Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'notes' ? (
                <textarea
                  value={notepadData.text}
                  onChange={handleTextChange}
                  placeholder="Type your notes here..."
                  className="w-full h-full bg-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              ) : (
                <div className="h-full flex flex-col">
                  {/* Drawing Tools */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-6 h-6 rounded-full border border-gray-600"
                        style={{ backgroundColor: color }}
                        title="Select color"
                      />
                      {showColorPicker && (
                        <div className="absolute z-20 mt-2">
                          <SketchPicker
                            color={color}
                            onChangeComplete={(c) => {
                              setColor(c.hex);
                              setShowColorPicker(false);
                            }}
                            disableAlpha
                            presetColors={['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF']}
                          />
                        </div>
                      )}
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-300">{brushSize}px</span>
                    </div>
                    <button onClick={clearCanvas} className="text-sm text-gray-400 hover:text-white flex items-center space-x-1">
                      <Icon icon="mdi:trash-can" width={16} />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* Drawing Canvas */}
                  <div className="flex-1 bg-white rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-full touch-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex flex-wrap gap-3 items-center">
          {feedback && (
            <div
              className={`text-sm font-medium px-3 py-1.5 rounded ${
                feedback.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleAutofill}
              disabled={isLoading || !canAutofill}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isLoading || !canAutofill
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={
                loadingSimbriefFromDb
                  ? 'Loading SimBrief ID...'
                  : canAutofill
                  ? `Use SimBrief ID: ${effectiveSimbriefId}`
                  : 'No SimBrief ID'
              }
            >
              {isLoading ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:cloud-download" />
                  <span>{loadingSimbriefFromDb && !effectiveSimbriefId ? 'Loading SimBrief ID...' : 'Autofill from SimBrief'}</span>
                </>
              )}
            </button>

            <button
              onClick={refreshWx}
              disabled={wxRefreshing}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                wxRefreshing ? 'bg-gray-700 text-gray-500' : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              <Icon icon="mdi:update" />
              <span>{wxRefreshing ? 'Refreshing…' : 'Refresh WX'}</span>
            </button>

            <button
              onClick={handleSendToOpsDiscord}
              disabled={isOpsSending}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isOpsSending ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Icon icon="mdi:discord" />
              <span>{isOpsSending ? 'Sending...' : 'Send to Ops (Discord)'}</span>
            </button>

            <button
              onClick={handleSendToHoppies}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center space-x-2"
            >
              <Icon icon="mdi:send" />
              <span>Send to Hoppies</span>
            </button>

            <button
              onClick={printLoadsheet}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white flex items-center space-x-2"
            >
              <Icon icon="mdi:printer" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

function CompactInfoBox({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-2">
      <label className="block text-xs font-medium text-gray-400 mb-0.5">{label}</label>
      <div className="text-sm font-mono text-white truncate">{value || '—'}</div>
    </div>
  );
}

export default LoadsheetModal;
