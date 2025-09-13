import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const logon  = searchParams.get('logon');
  const from   = searchParams.get('from');
  const to     = searchParams.get('to');
  const packet = searchParams.get('packet');

  if (!logon || !from || !to || !packet) {
    return Response.json({ success: false, error: "Missing params" }, { status: 400 });
  }

  const url = `http://www.hoppie.nl/acars/system/connect.html?logon=${encodeURIComponent(logon)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=telex&packet=${encodeURIComponent(packet)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    return Response.json({ success: true, result: text });
  } catch (e) {
    return Response.json({ success: false, error: (e as Error).toString() }, { status: 500 });
  }
}
