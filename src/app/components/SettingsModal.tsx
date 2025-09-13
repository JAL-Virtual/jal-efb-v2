// src/app/components/SettingsModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  onSave: (apiKey: string, hoppieId: string, simbriefId: string) => void;
  initialApiKey: string;
  initialHoppieId: string;
  initialSimbriefId: string;
};

function maskKey(key?: string | null) {
  const k = (key ?? '').trim();
  if (!k) return '';
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

// Local storage keys
const STORAGE_KEYS = {
  API_KEY: 'jal_apiKey',
  HOPPIE_ID: 'jal_hoppieId',
  SIMBRIEF_ID: 'jal_simbriefId'
};

const SettingsModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  initialApiKey,
  initialHoppieId,
  initialSimbriefId,
}) => {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hoppieId, setHoppieId] = useState(initialHoppieId || '');
  const [simbriefId, setSimbriefId] = useState(initialSimbriefId || '');
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load saved settings when modal opens
  useEffect(() => {
    if (show) {
      // Load from localStorage
      const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
      const savedHoppieId = localStorage.getItem(STORAGE_KEYS.HOPPIE_ID) || '';
      const savedSimbriefId = localStorage.getItem(STORAGE_KEYS.SIMBRIEF_ID) || '';
      
      setApiKey(savedApiKey);
      setHoppieId(savedHoppieId);
      setSimbriefId(savedSimbriefId);
      setShowApiKey(false);
      setErrMsg(null);
      setSuccessMsg(null);
    }
  }, [show]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setErrMsg('API Key is required');
      return;
    }
    
    setErrMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey.trim());
      localStorage.setItem(STORAGE_KEYS.HOPPIE_ID, hoppieId.trim());
      localStorage.setItem(STORAGE_KEYS.SIMBRIEF_ID, simbriefId.trim());
      
      setSuccessMsg('Settings saved successfully!');
      onSave(apiKey.trim(), hoppieId.trim(), simbriefId.trim());
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 1000);
    } catch (e: any) {
      setErrMsg('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  // Function to clear all settings
  const handleClearSettings = () => {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.HOPPIE_ID);
    localStorage.removeItem(STORAGE_KEYS.SIMBRIEF_ID);
    
    setApiKey('');
    setHoppieId('');
    setSimbriefId('');
    setSuccessMsg('All settings cleared!');
    
    setTimeout(() => {
      setSuccessMsg(null);
    }, 2000);
  };

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      {/* you can keep your AnimatedModalBg; color accents come from below */}
      <AnimatedModalBg />
      <div className="max-w-xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
        {/* colorful top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500" />
        {/* soft color blobs */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/25 rounded-full blur-xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-500/25 rounded-full blur-xl" />

        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
          PILOT PROFILE SETTINGS
        </h2>
        
        <p className="text-gray-300 text-center mb-8 text-sm">
          Enter your <b>API Key</b>, <b>Hoppie</b>, and <b>SimBrief</b> settings.
        </p>

        {/* live regions for a11y */}
        {errMsg && (
          <div
            className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-700/60 text-red-100 backdrop-blur-sm"
            role="alert"
            aria-live="polite"
          >
            {errMsg}
          </div>
        )}
        
        {successMsg && (
          <div
            className="mb-6 p-4 rounded-lg bg-emerald-900/40 border border-emerald-700/60 text-emerald-100 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            {successMsg}
          </div>
        )}

        <div className="flex flex-col gap-6 relative z-10">
          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">API KEY</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="w-full p-3 border border-white/15 rounded-lg bg-white/5 text-white pr-24 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder:text-white/40"
                value={showApiKey ? apiKey : maskKey(apiKey)}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API Key"
                disabled={saving}
                aria-label="API Key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded-md bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-colors"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-white/60">
              Your API key identifies your profile in the system
            </p>
          </div>

          {/* Hoppie */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">HOPPIE LOGON CODE</label>
            <input
              type="text"
              className="w-full p-3 border border-white/15 rounded-lg bg-white/5 text-white outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 placeholder:text-white/40"
              value={hoppieId}
              onChange={(e) => setHoppieId(e.target.value)}
              placeholder="e.g. Hoppie ID"
              disabled={saving}
            />
          </div>

          {/* SimBrief */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">SIMBRIEF PILOT ID</label>
            <input
              type="text"
              className="w-full p-3 border border-white/15 rounded-lg bg-white/5 text-white outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-white/40"
              value={simbriefId}
              onChange={(e) => setSimbriefId(e.target.value)}
              placeholder="e.g. Simbrief ID"
              disabled={saving}
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className={`flex-1 py-3.5 rounded-lg font-semibold shadow-lg transition-all ${
                saving || !apiKey.trim()
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 via-fuchsia-500 to-sky-500 text-white hover:from-rose-500 hover:to-sky-400'
              }`}
            >
              {saving ? 'SAVING…' : 'SAVE SETTINGS'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3.5 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/15 border border-white/10"
            >
              CANCEL
            </button>
          </div>

          {/* Clear Settings Button */}
          <div className="mt-4 text-center">
            <button
              onClick={handleClearSettings}
              className="text-xs text-white/60 hover:text-white/80 underline underline-offset-4 decoration-dotted decoration-white/40"
            >
              Clear all settings
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
