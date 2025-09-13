import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // no SSR cache

// Try AviationWeather.gov (NOAA/ADDS) for both METAR & TAF,
// then normalize to the structure your LoadsheetModal expects.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const icaosParam = (searchParams.get('icaos') || '').toUpperCase();
  const ids = icaosParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',');

  if (!ids) {
    return NextResponse.json({ error: 'Missing ?icaos=AAA,BBB' }, { status: 400 });
  }

  const metarUrl = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=JSON`;
  const tafUrl   = `https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=JSON`;

  try {
    const [metarRes, tafRes] = await Promise.all([
      fetch(metarUrl, { cache: 'no-store' }),
      fetch(tafUrl,   { cache: 'no-store' }),
    ]);

    // Upstream may return [] or an object – normalize defensively
    const metarJson: any = metarRes.ok ? await metarRes.json().catch(() => []) : [];
    const tafJson:   any = tafRes.ok   ? await tafRes.json().catch(() => [])   : [];

    const normMetar = Array.isArray(metarJson) ? metarJson.map(normalizeMetar) : [];
    const normTaf   = Array.isArray(tafJson)   ? tafJson.map(normalizeTaf)     : [];

    return NextResponse.json(
      {
        metar: { data: { METAR: normMetar.filter(Boolean) } },
        taf:   { data: { TAF:   normTaf.filter(Boolean) } },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}

// NOAA/ADDS “data/metar” typical fields vary. We coerce into {station_id, raw_text}.
function normalizeMetar(x: any) {
  const station =
    x.station_id ||
    x.station ||
    x.icaoId ||
    x.icao ||
    guessIcaoFromRaw(x.raw_text || x.rawOb || '');

  const raw =
    x.raw_text ||
    x.rawOb ||
    x.raw ||
    '';

  if (!station || !raw) return null;
  return { station_id: String(station).toUpperCase(), raw_text: String(raw).trim() };
}

// NOAA/ADDS “data/taf” → {station_id, raw_text}
function normalizeTaf(x: any) {
  const station =
    x.station_id ||
    x.station ||
    x.icaoId ||
    x.icao ||
    guessIcaoFromRaw(x.raw_text || x.rawOb || '');

  const raw =
    x.raw_text ||
    x.rawOb ||
    x.raw ||
    '';

  if (!station || !raw) return null;
  return { station_id: String(station).toUpperCase(), raw_text: String(raw).trim() };
}

function guessIcaoFromRaw(raw: string) {
  // e.g. "METAR RJTT 031130Z ..." → picks 2nd token
  const tk = raw.trim().split(/\s+/);
  return tk.length > 1 ? tk[1] : '';
}
