'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import AnimatedModalBg from './AnimatedModalBg';

type Props = {
  show: boolean;
  onClose: () => void;
  onSave: (pilotId: string, hoppieId: string, simbriefId: string) => void;
  initialPilotId: string;
  initialHoppieId: string;
  initialSimbriefId: string;
};

const SettingsModal: React.FC<Props> = ({
  show,
  onClose,
  onSave,
  initialPilotId,
  initialHoppieId,
  initialSimbriefId,
}) => {
  const [pilotId, setPilotId] = useState(initialPilotId || '');
  const [hoppieId, setHoppieId] = useState(initialHoppieId || '');
  const [simbriefId, setSimbriefId] = useState(initialSimbriefId || '');
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Reset values whenever modal opens
  useEffect(() => {
    if (!show) return;
    setPilotId(initialPilotId || '');
    setHoppieId(initialHoppieId || '');
    setSimbriefId(initialSimbriefId || '');
    setErrMsg(null);
    setSuccessMsg(null);
  }, [show, initialPilotId, initialHoppieId, initialSimbriefId]);

  // Auto-fetch existing settings from MongoDB when modal opens
  useEffect(() => {
    if (!show) return;
    const id = (initialPilotId || pilotId || '').toUpperCase().trim();
    if (!id) return;

    const fetchExisting = async () => {
      try {
        setLoadingRemote(true);
        setErrMsg(null);
        const res = await fetch(`/api/user-settings?pilotId=${encodeURIComponent(id)}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        const data = await res.json();
        
        if (res.ok && data?.data) {
          setPilotId(data.data.pilotId || id);
          setHoppieId(data.data.hoppieId || '');
          setSimbriefId(data.data.simbriefId || '');
          
          if (data.data.pilotId) {
            setSuccessMsg('Existing settings loaded from database.');
            setTimeout(() => setSuccessMsg(null), 3000);
          }
        } else if (res.status === 404) {
          // No existing settings found - this is normal for new users
          console.log('No existing settings found for this pilot ID');
        } else {
          throw new Error(data?.error || 'Failed to fetch settings');
        }
      } catch (e: any) {
        console.error('Error fetching settings:', e);
        setErrMsg('Unable to load existing settings from database.');
      } finally {
        setLoadingRemote(false);
      }
    };

    fetchExisting();
  }, [show, initialPilotId, pilotId]);

  // Enter to save shortcut
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !saving) {
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, pilotId, hoppieId, simbriefId, saving]);

  function validate() {
    const id = pilotId.trim().toUpperCase();
    if (!id) return 'JAL Pilot ID is required.';
    if (!/^JAL[0-9A-Z]{3,}$/.test(id)) {
      return 'JAL Pilot ID should look like JALXXXX (letters/numbers).';
    }
    return null;
  }

  async function handleSave() {
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
        pilotId: pilotId.toUpperCase().trim(),
        hoppieId: (hoppieId || '').trim(),
        simbriefId: (simbriefId || '').trim(),
      };
      
      const res = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server error: ${res.status}`);
      }

      // Show success message
      setSuccessMsg('Settings saved to database successfully!');
      
      // Bubble up to parent state/localStorage
      onSave(body.pilotId, body.hoppieId, body.simbriefId);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Save error:', e);
      setErrMsg(e?.message || 'Failed to save to database. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <div className="max-w-xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 rounded-2xl shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b60c18] to-[#ea4256]"></div>
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#b60c18] opacity-20 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-[#ea4256] opacity-20 rounded-full"></div>
        
        <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-[#b60c18] to-[#ea4256] bg-clip-text text-transparent">
          PILOT PROFILE SETTINGS
        </h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Configure your JAL Virtual credentials</p>

        {errMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800/50 text-red-200 backdrop-blur-sm flex items-start">
            <svg className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{errMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800/50 text-green-200 backdrop-blur-sm flex items-start">
            <svg className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <div ref={formRef} className="flex flex-col gap-6 relative z-10">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              JAL PILOT ID
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all placeholder-gray-500"
                value={pilotId}
                onChange={(e) => setPilotId(e.target.value.toUpperCase())}
                placeholder="e.g. JAL1234"
                autoFocus
                disabled={loadingRemote || saving}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">Format: JAL followed by letters/numbers (e.g. JAL1234)</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              HOPPIE LOGON CODE
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all placeholder-gray-500"
                value={hoppieId}
                onChange={(e) => setHoppieId(e.target.value)}
                placeholder="e.g. XXXXXXXXXXXXX"
                disabled={saving}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">Your Hoppie logon code for CPDLC communications</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              SIMBRIEF PILOT ID
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full p-3 pl-10 border border-gray-600 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white focus:ring-2 focus:ring-[#b60c18] focus:border-transparent transition-all placeholder-gray-500"
                value={simbriefId}
                onChange={(e) => setSimbriefId(e.target.value)}
                placeholder="e.g. 123456"
                disabled={saving}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500">Your SimBrief ID for flight plan integration</p>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving || loadingRemote}
              className={`flex-1 py-3.5 rounded-lg font-semibold shadow-lg transition-all duration-300 flex items-center justify-center ${
                saving || loadingRemote
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#b60c18] to-[#ea4256] text-white hover:shadow-xl hover:from-[#c21c28] hover:to-[#ea5266] transform hover:-translate-y-0.5'
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SAVING TO DATABASE...
                </>
              ) : (
                'SAVE TO DATABASE'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3.5 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              CANCEL
            </button>
          </div>

          {loadingRemote && (
            <div className="flex items-center justify-center text-gray-400 mt-2">
              <svg className="animate-spin h-5 w-5 mr-2 text-[#b60c18]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Querying database for existing settings...
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;