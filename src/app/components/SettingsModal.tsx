// src/app/components/SettingsModal.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  // เปลี่ยน signature: ส่ง apiKey + simbriefId กลับ
  onSave: (apiKey: string, simbriefId: string) => void;
  // ยังรับค่าเริ่มต้นสำหรับ Hoppie/SimBrief ได้ (ถ้าจะตั้ง)
  initialHoppieId: string;
  initialSimbriefId: string;
};

function maskKey(key?: string | null) {
  const k = (key ?? '').trim();
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

const SettingsModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  initialHoppieId,
  initialSimbriefId,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

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

  // เปิดโมดัล: โหลด apiKey จาก localStorage → ลองอ่านจาก DB ด้วย apiKey
  useEffect(() => {
    if (!show) return;

    setErrMsg(null);
    setSuccessMsg(null);
    setHoppieId(initialHoppieId || '');
    setSimbriefId(initialSimbriefId || '');

    let cancelled = false;
    (async () => {
      setLoading(true);
      const stored = typeof window !== 'undefined' ? localStorage.getItem('jalApiKey') || '' : '';
      setApiKey(stored);

      if (stored) {
        try {
          const res = await fetch(`/api/user-settings?apiKey=${encodeURIComponent(stored)}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          const json = await res.json().catch(() => ({}));
          if (cancelled) return;

          if (res.ok && json?.data) {
            setHoppieId(json.data.hoppieId || '');
            setSimbriefId(json.data.simbriefId || '');
            flashSuccess('Loaded your saved IDs.');
          } else if (res.status !== 404) {
            setErrMsg(json?.error || 'Failed to fetch settings');
          }
        } catch (e: any) {
          if (!cancelled) setErrMsg(e?.message || 'Failed to fetch settings');
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [show, initialHoppieId, initialSimbriefId, flashSuccess]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setErrMsg('Please paste your API Key.');
      return;
    }
    setErrMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const res = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          hoppieId: (hoppieId || '').trim(),
          simbriefId: (simbriefId || '').trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Server error: ${res.status}`);

      // เก็บ apiKey ลง localStorage เพื่อให้ส่วนอื่นใช้ต่อได้
      if (typeof window !== 'undefined') localStorage.setItem('jalApiKey', apiKey.trim());

      flashSuccess('Saved!');
      onSave(apiKey.trim(), json.data?.simbriefId || simbriefId || '');
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
          Store your <b>API Key</b> (DB) + your <b>Hoppie</b> and <b>SimBrief</b>.
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
          {/* API KEY */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">API KEY</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800/70 text-white pr-24"
                value={showKey ? apiKey : maskKey(apiKey)}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API Key from crew.jalvirtual.com"
                disabled={saving || loading}
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
          </div>

          {/* Hoppie */}
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

          {/* SimBrief */}
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
              disabled={saving || loading || !apiKey.trim()}
              className={`flex-1 py-3.5 rounded-lg font-semibold shadow-lg transition-all ${
                saving || loading || !apiKey.trim()
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
