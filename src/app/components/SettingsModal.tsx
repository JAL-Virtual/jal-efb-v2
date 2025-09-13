'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  // Dashboard ยังเรียก onSave(pilotId, simbriefId) อยู่ — เราจะส่ง pilotId ที่ resolve ได้กลับไป (แต่ไม่โชว์ใน UI)
  onSave: (pilotId: string, simbriefId: string) => void;

  /** fallback-only (ไม่แสดงผลแล้ว) */
  initialPilotId: string;
  initialHoppieId: string;
  initialSimbriefId: string;
};

/* ----------------------------- helpers ---------------------------------- */
function normalizeJalId(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (/^JAL[0-9A-Z]+$/i.test(s)) return s.toUpperCase();
  if (/^\d+$/.test(s)) return `JAL${s}`;
  s = s.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (!s.startsWith('JAL')) s = `JAL${s}`;
  return s;
}

/** crew API id lives under many names; try a bunch */
function pickCrewId(payload: any): unknown {
  const d = payload?.data ?? payload?.user ?? payload ?? {};
  return d.id ?? d.pilot_id ?? d.pilotId ?? d.pilotid ?? d.user_id ?? d.vid ?? d.callsign;
}

function pickCrewName(payload: any): string | undefined {
  const d = payload?.data ?? payload?.user ?? payload ?? {};
  return d.name ?? d.fullname ?? d.full_name ?? d.display_name ?? undefined;
}

// mask API key like ABCD••••WXYZ
function maskKey(key?: string | null) {
  const k = (key ?? '').trim();
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

/* ------------------------------------------------------------------------ */
const SettingsModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  initialPilotId,
  initialHoppieId,
  initialSimbriefId,
}) => {
  // ===== API KEY (จาก localStorage) — โชว์ใน UI แบบ mask =====
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState(false);

  // ===== Hidden: JAL ID (resolve จาก crew API ด้วย apiKey) — ไม่โชว์ =====
  const [pilotId, setPilotId] = useState<string>('');

  // ===== Mongo-backed fields =====
  const [hoppieId, setHoppieId] = useState(initialHoppieId || '');
  const [simbriefId, setSimbriefId] = useState(initialSimbriefId || '');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const flashSuccess = useCallback((msg: string, ms = 2000) => {
    setSuccessMsg(msg);
    const t = setTimeout(() => setSuccessMsg(null), ms);
    return () => clearTimeout(t);
  }, []);

  /** อ่านโปรไฟล์ผ่าน proxy route /api/jal/user โดยใช้ API Key */
  const fetchCrewProfile = useCallback(async (key: string): Promise<{ id: string | null; name: string | null }> => {
    const res = await fetch('/api/jal/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ apiKey: key }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.debug('crew user error', res.status, json);
      return { id: null, name: null };
    }
    const rawId = pickCrewId(json);
    const name = pickCrewName(json) ?? null;
    const id = normalizeJalId(rawId);
    return { id, name };
  }, []);

  /** โหลดค่า Hoppie/SimBrief จาก MongoDB โดยอ้างอิง pilotId ที่ resolve ได้ (แต่อย่าโชว์ pilotId) */
  const loadMongoSettings = useCallback(
    async (pid: string) => {
      try {
        const res = await fetch(`/api/user-settings?pilotId=${encodeURIComponent(pid)}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json();
        if (res.ok && data?.data) {
          setHoppieId(data.data.hoppieId || '');
          setSimbriefId(data.data.simbriefId || '');
          flashSuccess('Loaded your saved IDs.');
        } else if (res.status === 404) {
          setHoppieId('');
          setSimbriefId('');
        } else {
          throw new Error(data?.error || 'Failed to fetch settings');
        }
      } catch (e: any) {
        setErrMsg(e?.message || 'Unable to load settings.');
      }
    },
    [flashSuccess]
  );

  /** เปิดโมดัล: อ่าน API Key จาก localStorage → resolve pilotId จาก API → โหลด Mongo */
  useEffect(() => {
    if (!show) return;

    setErrMsg(null);
    setSuccessMsg(null);

    // reset to props ขณะกำลัง resolve
    setPilotId(initialPilotId || '');
    setHoppieId(initialHoppieId || '');
    setSimbriefId(initialSimbriefId || '');

    let cancelled = false;
    (async () => {
      setLoading(true);

      const key = typeof window !== 'undefined' ? localStorage.getItem('jalApiKey') || '' : '';
      setApiKey(key);

      if (!key) {
        setErrMsg('No API Key found. Please sign in on the landing screen.');
        setLoading(false);
        return;
      }

      const profile = await fetchCrewProfile(key);

      let pid = profile.id ?? null;
      if (!pid) pid = normalizeJalId(initialPilotId);
      if (cancelled) return;

      if (!pid) {
        setErrMsg('Unable to resolve your account from the API key.');
        setLoading(false);
        return;
      }

      setPilotId(pid);
      await loadMongoSettings(pid);

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [show, initialPilotId, initialHoppieId, initialSimbriefId, fetchCrewProfile, loadMongoSettings]);

  const handleSave = async () => {
    if (!apiKey) {
      setErrMsg('No API Key — please sign in again.');
      return;
    }
    if (!pilotId) {
      setErrMsg('Could not resolve your account from the API Key.');
      return;
    }

    setErrMsg(null);
    setSuccessMsg(null);

    try {
      setSaving(true);
      const body = {
        pilotId: pilotId.toUpperCase(), // ใช้ผูกข้อมูลใน DB แต่ไม่โชว์ใน UI
        hoppieId: (hoppieId || '').trim(),
        simbriefId: (simbriefId || '').trim(),
      };

      const res = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error: ${res.status}`);

      flashSuccess('Saved!');
      onSave(body.pilotId, body.simbriefId);
      setTimeout(() => onClose(), 800);
    } catch (e: any) {
      setErrMsg(e?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div className="max-w-xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b60c18] to-[#ea4256]" />
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#b60c18] opacity-20 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#ea4256] opacity-20 rounded-full" />

        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-[#b60c18] to-[#ea4256] bg-clip-text text-transparent">
          PILOT PROFILE SETTINGS
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Link via <b>API Key</b>. Only <b>Hoppie</b> &amp; <b>SimBrief</b> are stored in the database.
        </p>

        {errMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800/50 text-red-200 backdrop-blur-sm">
            {errMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800/50 text-green-200 backdrop-blur-sm">
            {successMsg}
          </div>
        )}

        <div ref={formRef} className="flex flex-col gap-6 relative z-10">
          {/* API KEY (read-only; from localStorage) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">API KEY</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 text-white pr-24"
                value={showKey ? apiKey : maskKey(apiKey)}
                disabled
                aria-label="JAL API Key"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              API Key is read from your device (localStorage). To change it, sign out then sign in on the landing screen.
            </p>
          </div>

          {/* Hoppie (Mongo) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">HOPPIE LOGON CODE</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 text-white"
              value={hoppieId}
              onChange={(e) => setHoppieId(e.target.value)}
              placeholder="e.g. ABCDEF"
              disabled={saving || loading}
            />
          </div>

          {/* SimBrief (Mongo) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">SIMBRIEF PILOT ID</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 text-white"
              value={simbriefId}
              onChange={(e) => setSimbriefId(e.target.value)}
              placeholder="e.g. 123456"
              disabled={saving || loading}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || loading || !apiKey || !pilotId}
              className={`flex-1 py-3.5 rounded-lg font-semibold shadow-lg transition-all ${
                saving || loading || !apiKey || !pilotId
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#b60c18] to-[#ea4256] text-white hover:from-[#c21c28] hover:to-[#ea5266]'
              }`}
            >
              {saving ? 'SAVING…' : 'SAVE TO DATABASE'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3.5 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600"
            >
              CANCEL
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center text-gray-400 mt-2">
              Loading…
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
