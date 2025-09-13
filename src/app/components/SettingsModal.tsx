'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  onSave: (pilotId: string, simbriefId: string) => void;
  /** kept only for fallback */
  initialPilotId: string;
  initialHoppieId: string;
  initialSimbriefId: string;
};

/* ----------------------------- helpers ---------------------------------- */
function normalizeJalId(v: string | number | undefined | null): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (/^JAL[0-9A-Z]+$/i.test(s)) return s.toUpperCase();
  if (/^\d+$/.test(s)) return `JAL${s}`;
  s = s.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (!s.startsWith('JAL')) s = `JAL${s}`;
  return s;
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
  // JAL ID (resolved automatically; not editable)
  const [pilotId, setPilotId] = useState(initialPilotId || '');

  // Mongo-backed fields (editable)
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

  /** Resolve JAL ID primarily from crew API; fallback to /api/auth/me; then props */
  const resolvePilotId = useCallback(async (): Promise<string | null> => {
    // 1) crew.jalvirtual.com via our proxy
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('jalApiKey') : null;
      if (apiKey) {
        const r = await fetch('/api/jal/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ apiKey }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok) {
          const id = normalizeJalId(j?.user?.jalId);
          if (id) return id;
        }
      }
    } catch {
      /* ignore and try next path */
    }

    // 2) session (/api/auth/me) if you still have it around
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        const id = normalizeJalId(j?.user?.jalId);
        if (id) return id;
      }
    } catch {
      /* ignore */
    }

    // 3) last resort: prop
    const fallback = normalizeJalId(initialPilotId);
    return fallback;
  }, [initialPilotId]);

  /** Load Mongo (only hoppie/simbrief) for this pilotId */
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
          // nothing saved yet — leave blanks
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

  // When modal opens: resolve JAL ID then pull Mongo record
  useEffect(() => {
    if (!show) return;

    setErrMsg(null);
    setSuccessMsg(null);

    // reset to props while resolving
    setPilotId(initialPilotId || '');
    setHoppieId(initialHoppieId || '');
    setSimbriefId(initialSimbriefId || '');

    let cancelled = false;
    (async () => {
      setLoading(true);
      const id = await resolvePilotId();
      if (cancelled) return;

      if (!id) {
        setErrMsg('Unable to resolve your JAL Pilot ID. Please log in and try again.');
        setLoading(false);
        return;
      }
      setPilotId(id);
      await loadMongoSettings(id);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [show, initialPilotId, initialHoppieId, initialSimbriefId, resolvePilotId, loadMongoSettings]);

  const handleSave = async () => {
    if (!pilotId) {
      setErrMsg('Missing JAL Pilot ID; cannot save.');
      return;
    }
    setErrMsg(null);
    setSuccessMsg(null);
    try {
      setSaving(true);
      const body = {
        pilotId: pilotId.toUpperCase(),
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
      setTimeout(() => onClose(), 900);
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
          Set your <strong>Hoppie</strong> & <strong>SimBrief</strong> IDs. Your JAL ID is linked automatically.
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
          {/* tiny helper about the linked JAL ID (read-only, just info) */}
          {pilotId && (
            <p className="text-xs text-gray-400 -mt-2">
              Linked to <span className="font-semibold text-gray-300">{pilotId}</span>
            </p>
          )}

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
              disabled={saving || loading || !pilotId}
              className={`flex-1 py-3.5 rounded-lg font-semibold shadow-lg transition-all ${
                saving || loading || !pilotId
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
