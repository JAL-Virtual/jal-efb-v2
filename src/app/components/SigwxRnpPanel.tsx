'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function SigwxRnpPanel({ callsign, hoppieId }: { callsign: string; hoppieId: string }) {
  const [rnp, setRnp] = useState('0.3');
  const [sigwx, setSigwx] = useState('ISOL TS NW OF ROUTE FL300-380; MOD ICE FL180-240');
  const [sending, setSending] = useState(false);
  async function send() {
    setSending(true);
    const packet = encodeURIComponent(`OPS/RNP:${rnp}\nSIGWX:${sigwx}`);
    const url = `http://www.hoppie.nl/acars/system/connect.html?logon=${hoppieId}&from=EFB&to=${encodeURIComponent(callsign)}&type=telex&packet=${packet}`;
    try { await fetch(url); } finally { setSending(false); }
  }
  return (
    <div className="rounded-xl bg-gray-800 border border-gray-700 p-3 text-sm text-gray-200">
      <div className="flex items-center gap-2 mb-2"><Icon icon="mdi:weather-cloudy-alert" /> SIGWX & RNP</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div><label className="text-xs text-gray-400">RNP</label><input className="w-full bg-gray-700 rounded px-2 py-1" value={rnp} onChange={(e)=>setRnp(e.target.value)} /></div>
        <div className="md:col-span-2"><label className="text-xs text-gray-400">SIGWX Summary</label><textarea className="w-full bg-gray-700 rounded px-2 py-1" rows={3} value={sigwx} onChange={(e)=>setSigwx(e.target.value)} /></div>
      </div>
      <button disabled={sending} onClick={send} className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700">
        {sending ? 'Sending…' : 'Send via ACARS'}
      </button>
    </div>
  );
}
