'use client';

import React, { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import AnimatedModalBg from "./AnimatedModalBg";

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
  const [pilotId, setPilotId] = useState(initialPilotId || "");
  const [hoppieId, setHoppieId] = useState(initialHoppieId || "");
  const [simbriefId, setSimbriefId] = useState(initialSimbriefId || "");

  useEffect(() => {
    if (show) {
      setPilotId(initialPilotId || "");
      setHoppieId(initialHoppieId || "");
      setSimbriefId(initialSimbriefId || "");
    }
  }, [show, initialPilotId, initialHoppieId, initialSimbriefId]);

  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onSave(pilotId, hoppieId, simbriefId);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, pilotId, hoppieId, simbriefId, onClose, onSave]);

  if (!show) return null;

  return (
    <Modal onClose={onClose} wide>
      <AnimatedModalBg />
      <h2 className="text-2xl font-extrabold mb-6 text-[#b60c18] tracking-wide text-center">
        CONFIGURE YOUR DETAILS
      </h2>
      <div ref={formRef} className="flex flex-col gap-6 max-w-md mx-auto">
        <label className="block text-[#b60c18] font-semibold">
          JAL PILOT ID
          <input
            type="text"
            className="mt-2 block w-full px-4 py-3 rounded-lg border-2 border-[#b60c18] focus:outline-none focus:ring-4 focus:ring-[#b60c18]/50 text-lg font-medium"
            value={pilotId}
            onChange={e => setPilotId(e.target.value.toUpperCase())}
            placeholder="e.g. JALXXXX"
            autoFocus
          />
        </label>

        <label className="block text-[#b60c18] font-semibold">
          HOPPIE LOGON CODE
          <input
            type="text"
            className="mt-2 block w-full px-4 py-3 rounded-lg border-2 border-[#b60c18] focus:outline-none focus:ring-4 focus:ring-[#b60c18]/50 text-lg font-medium"
            value={hoppieId}
            onChange={e => setHoppieId(e.target.value)}
            placeholder="e.g. XXXXXXXXXXXXXXXXXXXXXXXXX"
          />
        </label>

        <label className="block text-[#b60c18] font-semibold">
          SIMBRIEF PILOT ID
          <input
            type="text"
            className="mt-2 block w-full px-4 py-3 rounded-lg border-2 border-[#b60c18] focus:outline-none focus:ring-4 focus:ring-[#b60c18]/50 text-lg font-medium"
            value={simbriefId}
            onChange={e => setSimbriefId(e.target.value)}
            placeholder="e.g. XXXX"
          />
        </label>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => {
              onSave(pilotId, hoppieId, simbriefId);
              onClose();
            }}
            className="flex-1 bg-[#b60c18] text-white py-3 rounded-lg shadow-lg font-semibold hover:bg-[#a10c18] active:scale-95 transition-transform"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-[#b60c18] py-3 rounded-lg shadow font-semibold hover:bg-gray-300 active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
