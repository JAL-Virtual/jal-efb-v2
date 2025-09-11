import { NextRequest, NextResponse } from "next/server";

// --- CONFIG ---
const HOPPIE_LOGON_API = "https://www.hoppie.nl/acars/system/online.html";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1390668927599775804/IUj-c3GQMHC_VZSqj9UMtczOq_aTRy8PpWImMl_b6MXsVDLYGrFra8vWnfx6unno43Kp";

// --- Callsign Prefixes to ALLOW ---
const ALLOWED_PREFIXES = [
  "JAL", "JAC", "JTA", "JJP", "HAC", "RAC", "SJO", "TZP"
];
const CALLSIGN_REGEX = new RegExp(`^(${ALLOWED_PREFIXES.join('|')})`, "i");

// --- In-memory (runtime) cache ---
const seen: Record<string, string> = {}; // { callsign: ISO date notified }

function formatZuluTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date
    .getUTCFullYear()
    .toString()
    .slice(-2)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} Z`;
}

// Send message to Discord Webhook (plain text or embed)
async function postToWebhook(callsign: string, logonTime: string) {
  // You can make this an embed if you want rich style
  const payload = {
    username: "Hoppie Online Notify",
    avatar_url: "https://cdn.discordapp.com/icons/139010410093289472/90916b1d3322426f607e7b60d0e25c99.webp",
    embeds: [
      {
        title: "🟢 Hoppie Logon Detected",
        description: `**Callsign:** \`${callsign}\`\n**Logon Time:** ${logonTime}`,
        color: 0x00d26a,
        timestamp: new Date().toISOString()
      }
    ]
  };
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function GET(req: NextRequest) {
  if (WEBHOOK_URL === "https://discord.com/api/webhooks/1390668927599775804/IUj-c3GQMHC_VZSqj9UMtczOq_aTRy8PpWImMl_b6MXsVDLYGrFra8vWnfx6unno43Kp") {
    return NextResponse.json({ error: "Webhook URL not set." }, { status: 500 });
  }
  try {
    const res = await fetch(HOPPIE_LOGON_API, { cache: "no-store" });
    const text = await res.text();
    const now = new Date();
    let newLogons: string[] = [];
    for (const line of text.split("\n")) {
      const cs = line.trim();
      // Filter: only allowed callsigns, and not already notified
      if (CALLSIGN_REGEX.test(cs) && cs && !seen[cs]) {
        seen[cs] = now.toISOString();
        const logonTime = formatZuluTime(now);
        await postToWebhook(cs, logonTime);
        newLogons.push(cs);
      }
    }
    // Prune old cache (6h)
    const expiry = Date.now() - 6 * 3600 * 1000;
    for (const cs in seen) {
      if (new Date(seen[cs]).getTime() < expiry) delete seen[cs];
    }
    return NextResponse.json({
      status: "ok",
      detected: newLogons,
      totalOnline: text.split("\n").filter((l) => l.trim()).length,
      message: newLogons.length
        ? `Detected ${newLogons.length} new logon(s): ${newLogons.join(", ")}`
        : "No new logons.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", error: String(e) },
      { status: 500 }
    );
  }
}
