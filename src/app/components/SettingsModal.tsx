'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  onSave: (pilotId: string, simbriefId: string) => void;
  /** kept for compat as fallback only */
  initialPilotId: string;
  initialHoppieId: string;
  initialSimbriefId: string;
};

/* ----------------------------- helpers ---------------------------------- */
function pickName(payload: any): string | undefined {
  // payload = *crew json* (not the wrapper)
  return (
    payload?.data?.name ||
    payload?.user?.name ||
    payload?.name ||
    payload?.pilot?.name ||
    undefined
  );
}

function pickIdRaw(payload: any): string | number | undefined {
  // try a bunch of common shapes
  return (
    payload?.data?.pilot_id ??
    payload?.data?.pilotid ??
    payload?.user?.pilot_id ??
    payload?.user?.pilotid ??
    payload?.pilot?.id ??
    payload?.id ??
    undefined
  );
}

/** Normalize into JAL-prefixed ID (e.g., 1234 -> JAL1234, jal567 -> JAL567) */
function formatJalId(v: string | number | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (/^JAL[0-9A-Z]+$/i.test(s)) return s.toUpperCase();
  if (/^[0-9]+$/.test(s)) return `JAL${s}`;
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
  // Locked ID we use for DB (prefer API → fallback session)
  const [pilotId, setPilotId] = useState(initialPilotId || '');

  // Mongo-backed fields
  const [hoppieId, setHoppieId] = useState(initialHoppieId || '');
  const [simbriefId, setSimbriefId] = useState(initialSimbriefId || '');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // From API (NOT Mongo): name (and we also try to get ID from API)
  const [jalName, setJalName] = useState<string | null>(null);
  const [apiPilotId, setApiPilotId] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  const flashSuccess = useCallback((msg: string, ms = 2200) => {
    setSuccessMsg(msg);
    const t = setTimeout(() => setSuccessMsg(null), ms);
    return () => clearTimeout(t);
  }, []);

  /** Resolve Pilot ID from session (/api/auth/me) with fallback to props. */
  const resolvePilotIdFromSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      const data = await res.json();
      if (res.ok) {
        const jal = data?.user?.jalId?.toString().toUpperCase().trim();
        if (jal) return jal;
      }
    } catch {
      /* ignore; use fallback */
    }
    const fallback = (initialPilotId || '').toUpperCase().trim();
    return fallback || null;
  }, [initialPilotId]);

  /** Load Hoppie/SimBrief from MongoDB for this pilotId. */
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
          flashSuccess('Loaded your saved profile.');
        } else if (res.status === 404) {
          // no saved profile yet -> leave empty
          setHoppieId('');
          setSimbriefId('');
        } else {
          throw new Error(data?.error || 'Failed to fetch settings');
        }
      } catch (e: any) {
        setErrMsg(e?.message || 'Unable to load MongoDB settings.');
      }
    },
    [flashSuccess]
  );

  /** Fetch NAME + (preferable) ID from JAL API using localStorage('jalApiKey'). */
  const fetchPilotFromApi = useCallback(async (): Promise<{ name?: string | null; jalId?: string | null }> => {
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('jalApiKey') : null;
      if (!apiKey) return { name: null, jalId: null };

      const res = await fetch('/api/jal/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ apiKey }),
      });
      const wrapper = await res.json().catch(() => ({}));
      // proxy shape = { data: <crew json> }
      const crew = wrapper?.data ?? {};
      const name = pickName(crew) ?? null;
      const apiId = formatJalId(pickIdRaw(crew));

      if (!res.ok) return { name: null, jalId: null };
      return { name, jalId: apiId };
    } catch {
      return { name: null, jalId: null };
    }
  }, []);

  /** On open: resolve IDs and load data:
   *  1) get sessionId
   *  2) fetch API {name, apiId}; if apiId found, override pilotId
   *  3) load Mongo using the final pilotId
   */
  useEffect(() => {
    if (!show) return;

    setErrMsg(null);
    setSuccessMsg(null);

    // reset to props while resolving
    setPilotId(initialPilotId || '');
    setHoppieId(initialHoppieId || '');
    setSimbriefId(initialSimbriefId || '');
    setJalName(null);
    setApiPilotId(null);

    let cancelled = false;
    (async () => {
      setLoading(true);

      const sessionId = await resolvePilotIdFromSession();
      if (cancelled) return;

      if (!sessionId) {
        setErrMsg('Unable to resolve your JAL Pilot ID from the server.');
        setLoading(false);
        return;
      }
      // start with session id
      let finalId = sessionId;
      setPilotId(sessionId);

      // pull from API
      const { name, jalId } = await fetchPilotFromApi();
      if (cancelled) return;

      if (name) setJalName(name);
      if (jalId) {
        setApiPilotId(jalId);
        // prefer API ID if present and valid
        finalId = jalId;
        setPilotId(jalId);
      }

      await loadMongoSettings(finalId);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    show,
    initialPilotId,
    initialHoppieId,
    initialSimbriefId,
    resolvePilotIdFromSession,
    fetchPilotFromApi,
    loadMongoSettings,
  ]);

  // pilotId is read-only in UI, but we still validate existence
  function validate() {
    const id = (pilotId || '').trim().toUpperCase();
    if (!id) return 'Missing JAL Pilot ID.';
    if (!/^JAL[0-9A-Z]{3,}$/.test(id)) return 'JAL ID should look like JAL1234.';
    return null;
  }

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setErrMsg(err);
      return;
    }
    setErrMsg(null);
    setSuccessMsg(null);

    try {
      setSaving(true);
      const body = {
        pilotId: pilotId.toUpperCase().trim(), // <- will be API ID if available
        hoppieId: (hoppieId || '').trim(),
        simbriefId: (simbriefId || '').trim(),
      };

      // Save to MongoDB
      const res = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error: ${res.status}`);

      flashSuccess('Saved to database!');
      onSave(body.pilotId, body.simbriefId);
      setTimeout(() => onClose(), 900);
    } catch (e: any) {
      setErrMsg(e?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  // Display prefers API name & ID; pilotId state already uses API ID when present
  const displayName = jalName ?? '—';
  const displayId = pilotId ? formatJalId(pilotId) : '—';
  const displayCombined = `${displayName} | ${displayId}`;

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
          Name/ID from JAL API (fallback session) • Hoppie/SimBrief stored in database
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
          {/* Name | JAL ID — read-only (name/id from API if available; id falls back to session) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">PILOT (name | JAL ID)</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 text-white"
              value={displayCombined}
              disabled
              aria-label="Pilot name and JAL ID"
            />
            <p className="text-xs text-gray-500">
              Name/ID fetched from crew.jalvirtual.com using your API key. If API ID isn&apos;t available, we keep your session ID.
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
              disabled={saving}
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
              disabled={saving}
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
              Loading your profile…
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
