import React, { useEffect, useState, useMemo } from "react";
import { MdFlight, MdMap, MdSearch, MdLayers, MdStar, MdOutlineInsertDriveFile } from "react-icons/md";

type Chart = {
  id: string;
  name?: string;
  title?: string;
  type_key?: string;
  url?: string;
  view_url?: string;
};

const CHART_CATEGORIES = [
  { key: "GEN", label: "General", icon: <MdFlight /> },
  { key: "GND", label: "Ground", icon: <MdMap /> },
  { key: "SID", label: "SID", icon: <MdLayers /> },
  { key: "STAR", label: "STAR", icon: <MdStar /> },
  { key: "APP", label: "Approach", icon: <MdOutlineInsertDriveFile /> },
];

function groupChartsByType(charts: Chart[]) {
  const groups: Record<string, Chart[]> = {};
  for (const cat of CHART_CATEGORIES) groups[cat.key] = [];
  for (const chart of charts) {
    const cat = (chart.type_key || "GEN").toUpperCase();
    if (groups[cat]) groups[cat].push(chart);
    else {
      if (!groups["GEN"]) groups["GEN"] = [];
      groups["GEN"].push(chart);
    }
  }
  return groups;
}

export default function SidebarChartFox({ icao = "VTBS" }: { icao?: string }) {
  const [charts, setCharts] = useState<Chart[]>([]);
  const [activeTab, setActiveTab] = useState("GEN");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    setErr("");
    fetch(`/api/chartfox?icao=${icao.toUpperCase()}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setErr(data.error);
        else setCharts(data.charts ?? []);
      })
      .catch(() => setErr("Failed to fetch charts"))
      .finally(() => setLoading(false));
  }, [icao]);

  const grouped = useMemo(() => groupChartsByType(charts), [charts]);
  const shownCharts = useMemo(() => {
    if (!search.trim()) return grouped[activeTab] || [];
    return (grouped[activeTab] || []).filter(
      c =>
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.title || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [grouped, activeTab, search]);

  return (
    <div className="flex min-h-[60vh] bg-white rounded-xl shadow border overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-50 border-r p-0 flex flex-col">
        <div className="font-bold text-lg p-5 pb-3 flex items-center gap-2 text-blue-700 tracking-wide">
          <MdFlight className="text-blue-400" size={26} />
          {icao.toUpperCase()}
        </div>
        <nav className="flex flex-col px-2 gap-1">
          {CHART_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition
                ${activeTab === cat.key ? "bg-blue-100 text-blue-700 shadow" : "hover:bg-gray-200 text-gray-600"}
              `}
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="ml-auto text-xs text-gray-400">{grouped[cat.key]?.length || 0}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 mt-3">
          <div className="relative">
            <input
              className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 pl-9 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring focus:border-blue-300 transition"
              placeholder="Search charts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <MdSearch className="absolute left-2 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
      </aside>

      {/* Chart List */}
      <main className="flex-1 px-6 py-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          {CHART_CATEGORIES.find(c => c.key === activeTab)?.label} Charts
        </h2>
        {loading ? (
          <div className="text-blue-500">Loading…</div>
        ) : err ? (
          <div className="text-red-500">{err}</div>
        ) : shownCharts.length === 0 ? (
          <div className="text-gray-400 italic">No charts found.</div>
        ) : (
          <div className="grid gap-3">
            {shownCharts.map(chart => (
              <a
                key={chart.id}
                href={chart.view_url || chart.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-5 py-3 transition shadow-sm"
              >
                <div className="font-semibold text-blue-900">{chart.name || chart.title}</div>
                {chart.title && (
                  <div className="text-xs text-blue-700 opacity-60">{chart.title}</div>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
