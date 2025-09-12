'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

type Notice = {
  _id: string;
  title: string;
  body: string;
  level: 'info' | 'warn' | 'error';
  read: boolean;
  createdAt: string;
};

export default function NotificationCenter({ pilotId, onClose }: { pilotId: string; onClose: () => void }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/notifications?pilotId=${encodeURIComponent(pilotId)}`, { cache: 'no-store' });
    const j = await r.json();
    setItems(j.data || []);
    setLoading(false);
  }

  useEffect(() => { if (pilotId) load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [pilotId]);

  async function markAllRead() {
    const ids = items.filter(i => !i.read).map(i => i._id);
    if (!ids.length) return;
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ ids }) });
    load();
  }

  return (
    <div className="w-[560px] max-w-full bg-gray-900 text-white rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:bell" />
          <span className="font-semibold">Notification Center</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-sm text-gray-300 hover:text-white">Mark all read</button>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <Icon icon="mdi:close" />
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-auto divide-y divide-gray-800">
        {loading ? (
          <div className="p-6 text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-400">No notifications</div>
        ) : (
          items.map(n => (
            <div key={n._id} className={`p-4 ${n.read ? 'opacity-70' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {n.title}
                  {n.level !== 'info' && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${n.level === 'warn' ? 'bg-yellow-600/40' : 'bg-red-600/40'}`}>
                      {n.level.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{new Date(n.createdAt).toUTCString()}</div>
              </div>
              <div className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{n.body}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
