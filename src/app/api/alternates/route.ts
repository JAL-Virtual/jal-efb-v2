import { NextResponse } from "next/server";

type Candidate = {
  icao: string;
  name?: string;
  lat: number;
  lon: number;
  longestRwyM?: number;
};

type Payload = {
  origin: { icao: string; lat: number; lon: number };
  destination: { icao: string; lat: number; lon: number };
  candidates: Candidate[];
  minima: { rwyMetersMin: number; visMetersMin: number; ceilingFtMin: number };
};

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineNM(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3440.065; // nm
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    const { origin, destination, candidates, minima } = body;
    if (!origin || !destination || !Array.isArray(candidates))
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });

    // Simple scoring: runway >= minima, compute (offtrack to OD mid) + weather penalty.
    const mid = { lat: (origin.lat + destination.lat) / 2, lon: (origin.lon + destination.lon) / 2 };

    // Optional live weather (METAR visibility/ceiling) via your weather API
    // Batch by 10 to keep it simple
    const icaos = candidates.map(c => c.icao).join(",");
    let wx: Record<string, { vis: number; ceiling: number }> = {};
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/weather?icaos=${icaos}`, { cache: "no-store" });
      const j = await r.json();
      // Parse quick-and-dirty visibility/ceiling if present (provider formats vary)
      const metars: any[] = j?.metar?.data?.METAR ?? [];
      for (const m of metars) {
        const id = (m.station_id || m.station || "").toUpperCase();
        const vis = Number(m.visibility_statute_mi ? m.visibility_statute_mi * 1609.34 : m.visibility ?? 9999);
        const ce = Number(m.sky_condition?.[0]?.cloud_base_ft_agl ?? m.ceiling ?? 10000);
        wx[id] = { vis, ceiling: ce };
      }
    } catch {}

    const ranked = candidates
      .filter(c => (c.longestRwyM ?? 0) >= minima.rwyMetersMin)
      .map(c => {
        const dist = haversineNM(mid, c);
        const W = wx[c.icao] || { vis: 99999, ceiling: 10000 };
        const wxPenalty =
          (W.vis < minima.visMetersMin ? 200 : 0) +
          (W.ceiling < minima.ceilingFtMin ? 200 : 0);
        const score = dist + wxPenalty + (minima.rwyMetersMin > (c.longestRwyM ?? 0) ? 500 : 0);
        return { ...c, score, wx: W, distNM: Math.round(dist) };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);

    return NextResponse.json({ origin: origin.icao, destination: destination.icao, ranked });
  } catch (e) {
    return NextResponse.json({ error: "alternate calc failed" }, { status: 500 });
  }
}
