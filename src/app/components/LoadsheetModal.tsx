'use client';
import React, { useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

// --- Utility functions ---
function toTonnes(val: string | number) {
  const n = Number(val);
  return isNaN(n) ? '' : (n / 1000).toFixed(1);
}
function formatDateDMY(str: string) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return d && m && y ? `${d}:${m}:${y}` : str;
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
    date: day && month && year ? `${day}:${month}:${year}` : '',
    time: hour && min ? `${hour}:${min}` : '',
  };
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
  loading?: boolean;
  hoppieId: string;
  initialFields?: Partial<LoadsheetFields>;
  onSubmit?: (fields: any) => Promise<string>;
};

// --- Toast Component ---
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  // Auto color for success/fail
  const isSuccess = message.startsWith('✅');
  return (
    <div className="fixed z-[9999] left-1/2 bottom-7 transform -translate-x-1/2 animate-toast-slide pointer-events-none">
      <div className={`jal-toast px-6 py-4 font-bold shadow-2xl text-lg border rounded-2xl ${isSuccess
        ? 'bg-[#282f0a]/95 text-[#ffe164] border-[#ffcb05]/70'
        : 'bg-[#2b181a]/95 text-[#ff6363] border-[#f77]/60'
        }`}>
        {message}
      </div>
      <style jsx>{`
        .animate-toast-slide {
          animation: toast-slide 0.55s cubic-bezier(.42,2,.39,.86) both;
        }
      `}</style>
    </div>
  );
}

export default function LoadsheetModal({
  show,
  onClose,
  onAutofill,
  simbriefId,
  loading = false,
  initialFields = {},
  hoppieId,
  onSubmit,
}: Props) {
  const [fields, setFields] = useState<LoadsheetFields>({ ...defaultFields, ...initialFields });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [isWebhookSending, setIsWebhookSending] = useState(false);
  const [highlight, setHighlight] = useState(false);

  async function handleAutofill() {
    setIsLoading(true);
    setFeedback(null);
    try {
      if (!simbriefId) throw new Error("SimBrief ID is not set!");
      const sb = await onAutofill(simbriefId);

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
      setFeedback("✅ Autofilled from SimBrief.");
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch (e: any) {
      setFeedback("❌ " + (e?.message || "Could not fetch SimBrief data."));
    }
    setIsLoading(false);
  }

  async function handleSendToWebhook() {
    setIsWebhookSending(true);
    setFeedback(null);

    // DARK THEME EMBED
    const embedContent = {
      embeds: [
        {
          title: "🟡 **Loadsheet Info**",
          color: 0x18191c,
          fields: [
            { name: "🟡 Callsign", value: `\`${fields.alignments || '-'}\``, inline: true },
            { name: "🟡 Date", value: `\`${fields.flightDate || '-'}\``, inline: true },
            { name: "🟡 PIC", value: `\`${fields.pic || '-'}\``, inline: true },
            { name: "🟡 Aircraft", value: `\`${fields.reg || '-'}\``, inline: true },
            { name: "Departure", value: `\`${fields.originIcao || '-'}\``, inline: true },
            { name: "Arrival", value: `\`${fields.destinationIcao || '-'}\``, inline: true },
            { name: "Cruise Altitude", value: `\`${fields.depRunway || '-'}\``, inline: true },
            { name: "Cost Index", value: `\`${fields.costIndex || '-'}\``, inline: true },
            { name: "ZFW / MAX", value: `\`${fields.estZfw || '-'} / ${fields.maxZfw || '-'}\``, inline: true },
            { name: "TOW / MAX", value: `\`${fields.estTow || '-'} / ${fields.maxTow || '-'}\``, inline: true },
            { name: "LAW / MAX", value: `\`${fields.estLdw || '-'} / ${fields.maxLdw || '-'}\``, inline: true },
            { name: "PAX", value: `\`${fields.pax || '-'}\``, inline: true },
            { name: "Cargo", value: `\`${fields.cargo || '-'}\``, inline: true },
            { name: "SID (DEP)", value: `\`${fields.sid || '-'}\``, inline: true },
            { name: "STAR (ARR)", value: `\`${fields.star || '-'}\``, inline: true },
            { name: "DEP TIME (Z)", value: `\`${fields.depTime || '-'}\``, inline: true },
            { name: "FLT TIME", value: `\`${fields.flightTime || '-'}\``, inline: true },
            {
              name: "🟡 Route",
              value: fields.route
                ? `\`\`\`fix\n${fields.route}\n\`\`\``
                : '`-`',
              inline: false,
            }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "JALv EFB PDC" }
        }
      ]
    };

    try {
      const response = await fetch(
        'https://discord.com/api/webhooks/1390280923546910823/Er5T421Q9dbk93I0-Kj4d60Fb2VeKojFIe6RHriV7B6iWkmkVupVBE9GwfiOYjZxzPg7',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(embedContent),
        }
      );
      if (response.ok) {
        setFeedback("✅ Loadsheet sent to PDC webhook!");
      } else {
        setFeedback("❌ Failed to send loadsheet.");
      }
    } catch (err) {
      setFeedback("❌ Error sending loadsheet.");
    }
    setIsWebhookSending(false);
  }

  async function handleSendToHoppies() {
    if (!fields.alignments) {
      setFeedback("❌ Simbrief data Not Found");
      return;
    }
    const callsign = fields.alignments || '';
    const packet = encodeURIComponent(buildHoppiesPacket(fields));
    const url = `http://www.hoppie.nl/acars/system/connect.html?logon=${hoppieId}&from=JALV&to=${callsign}&type=telex&packet=${packet}`;

    await fetch(url);
    setFeedback("✅ SUCCESS");
  }

  if (!show) return null;
  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div
        className="max-w-screen-lg mx-auto rounded-2xl shadow-2xl p-8 overflow-visible"
        style={{
          background: "linear-gradient(135deg,#18191c 75%,#23242a 100%)",
        }}
      >
        <h2 className="text-3xl font-bold mb-8 text-[#ffe164] tracking-widest text-center drop-shadow">
          LOADSHEET / {fields.alignments}
        </h2>
        {/* Info grid with highlight animation */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-x-8 gap-y-8 mb-12 transition-all
          ${highlight ? 'animate-glow' : ''}`}>
          <InfoBox label="ORIGIN" value={fields.originIcao} />
          <InfoBox label="DESTINATION" value={fields.destinationIcao} />
          <InfoBox label="PIC" value={fields.pic} />
          <InfoBox label="DATE" value={fields.flightDate} />
          <InfoBox label="DEP TIME (Z)" value={fields.depTime} />
          <InfoBox label="FLT TIME" value={fields.flightTime} />
          <InfoBox label="REG" value={fields.reg} />
          <InfoBox label="COST INDEX" value={fields.costIndex} />
          <InfoBox label="SID (DEP)" value={formatSidStar(fields.sid, fields.sidTrans)} />
          <InfoBox label="STAR (ARR)" value={formatSidStar(fields.star, fields.starTrans)} />
          <InfoBox label="PLAN RWY (DEP/ARR)" value={`${fields.depRunway} / ${fields.arrRunway}`} />
          <InfoBox label="ZFW / MAX" value={`${fields.estZfw} / ${fields.maxZfw}`} />
          <InfoBox label="TOW / MAX" value={`${fields.estTow} / ${fields.maxTow}`} />
          <InfoBox label="LAW / MAX" value={`${fields.estLdw} / ${fields.maxLdw}`} />
          <InfoBox label="CARGO" value={fields.cargo} />
          <InfoBox label="PASSENGER" value={fields.pax} />
        </div>
        {/* Route Section */}
        <div className="mb-10">
          <div className="mb-2 font-bold text-[#ffe164] tracking-wide text-lg">ROUTE</div>
          <div className="rounded-xl bg-[#23242a] border-2 border-[#ffe164]/30 p-4 text-white text-base whitespace-pre-line break-words">{fields.route}</div>
        </div>
        {/* METAR/TAF Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="font-bold mb-1 text-[#ffe164] text-lg">DEPARTURE</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-white mb-0">METAR</div>
                  <div className="rounded bg-[#18191c] border border-[#ffe164]/20 p-2 text-xs text-white break-words">{fields.depMetar}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white mb-0">TAF</div>
                  <div className="rounded bg-[#18191c] border border-[#ffe164]/20 p-2 text-xs text-white break-words">{fields.depTaf}</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="font-bold mb-1 text-[#ffe164] text-lg">ARRIVAL</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-semibold text-white mb-0">METAR</div>
                  <div className="rounded bg-[#18191c] border border-[#ffe164]/20 p-2 text-xs text-white break-words">{fields.arrMetar}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white mb-0">TAF</div>
                  <div className="rounded bg-[#18191c] border border-[#ffe164]/20 p-2 text-xs text-white break-words">{fields.arrTaf}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <button
            onClick={handleAutofill}
            className="flex-1 py-3 rounded-lg font-semibold shadow-md bg-gradient-to-r from-[#ffe164] to-[#d4af37] text-[#18191b] hover:scale-105 transition text-lg"
            disabled={isLoading || !simbriefId}
          >
            {isLoading ? "Fetching..." : "Autofill from SimBrief"}
          </button>
          <button
            onClick={handleSendToWebhook}
            className="flex-1 py-3 rounded-lg font-semibold shadow-md bg-blue-700 text-white hover:bg-blue-800 transition text-lg"
            disabled={isWebhookSending}
          >
            {isWebhookSending ? "Sending..." : "Send to Webhook"}
          </button>
          <button
            onClick={handleSendToHoppies}
            className="flex-1 py-3 rounded-lg font-semibold shadow-md bg-gradient-to-r from-[#10e7ff] to-[#1ea7ff] text-[#18191b] hover:from-[#39fff3] hover:to-[#46baff] hover:scale-105 transition text-lg"
          >
            Send to Hoppies Datalink
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-lg font-semibold shadow-md bg-[#292c35] text-white hover:bg-[#373842] transition text-lg"
        >
          Close
        </button>
        {/* Toast notification (overlays modal, bottom center) */}
        <Toast message={feedback ?? ""} onClose={() => setFeedback(null)} />
      </div>
      <style jsx global>{`
        @keyframes toast-slide {
          0% { opacity: 0; transform: translateY(50px) scale(0.95);}
          100% { opacity: 1; transform: translateY(0) scale(1);}
        }
        @keyframes glow-pop {
          0% {
            box-shadow: 0 0 0px #ffe164;
          }
          30% {
            box-shadow: 0 0 28px 8px #ffe164;
          }
          80% {
            box-shadow: 0 0 14px 2px #ffe16488;
          }
          100% {
            box-shadow: 0 0 0px #ffe16400;
          }
        }
        .animate-glow {
          animation: glow-pop 1.2s cubic-bezier(.4,1.6,.4,1) 1;
        }
      `}</style>
    </Modal>
  );
}

// InfoBox for each cell
function InfoBox({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col rounded-xl border bg-[#22242b]/95 border-[#ffe164]/15 p-4 min-h-[72px] min-w-[120px] max-w-[180px] h-[72px] justify-between shadow-sm transition-all">
      <span className="text-xs text-[#ffe164] font-bold mb-1 tracking-wider uppercase whitespace-nowrap">{label}</span>
      <span className="text-[15px] text-white font-medium truncate">{value || '-'}</span>
    </div>
  );
}
