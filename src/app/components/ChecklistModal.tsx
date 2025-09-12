'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Modal from './Modal';

type Item = { id: string; text: string; done?: boolean; order: number };
type List = { _id?: string; name: string; items: Item[] };

export default function ChecklistModal({ pilotId, show, onClose }: { pilotId: string; show: boolean; onClose: () => void }) {
  const [lists, setLists] = useState<List[]>([]);
  const [active, setActive] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/checklists?pilotId=${encodeURIComponent(pilotId)}`, { cache: 'no-store' });
    const j = await r.json();
    setLists((j.data || []).map((x: any) => ({ _id: x._id, name: x.name, items: x.items || [] })));
    setActive(0);
    setLoading(false);
  }
  useEffect(() => { if (show && pilotId) load(); }, [show, pilotId]);

  function addItem() {
    const L = [...lists];
    const l = L[active];
    l.items.push({ id: crypto.randomUUID(), text: '', order: l.items.length });
    setLists(L);
  }
  function saveLocal(l: List) { setLists(prev => prev.map((p,i)=> i===active? l : p)); }

  async function saveToDb() {
    const l = lists[active];
    if (!l) return;
    if (l._id) {
      await fetch('/api/checklists', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l) });
    } else {
      const r = await fetch('/api/checklists', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pilotId, ...l }) });
      const j = await r.json();
      l._id = j.data?._id;
      saveLocal(l);
    }
    onClose();
  }

  return !show ? null : (
    <Modal onClose={onClose} wide>
      <div className="w-[720px] max-w-full bg-gray-900 text-white rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:clipboard-list" />
            <span className="font-semibold">My Checklists</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addItem} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">Add Item</button>
            <button onClick={saveToDb} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Save</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg"><Icon icon="mdi:close" /></button>
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="text-gray-400">Loading…</div>
          ) : lists.length === 0 ? (
            <button
              className="px-4 py-2 bg-blue-600 rounded-lg"
              onClick={() => setLists([{ name: 'New Checklist', items: [] }])}
            >Create Checklist</button>
          ) : (
            <div className="space-y-2">
              <input
                className="bg-transparent border border-gray-700 rounded-lg px-3 py-2 w-full"
                value={lists[active].name}
                onChange={(e) => saveLocal({ ...lists[active], name: e.target.value })}
              />
              {lists[active].items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!it.done}
                    onChange={(e) => {
                      const L = [...lists]; L[active].items[idx].done = e.target.checked; setLists(L);
                    }}
                  />
                  <input
                    className="flex-1 bg-transparent border-b border-gray-700 px-2 py-1"
                    value={it.text}
                    onChange={(e) => {
                      const L = [...lists]; L[active].items[idx].text = e.target.value; setLists(L);
                    }}
                    placeholder="Item"
                  />
                  <button
                    className="p-1 hover:bg-gray-800 rounded"
                    onClick={() => {
                      const L = [...lists]; L[active].items.splice(idx,1); setLists(L);
                    }}
                  >
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
