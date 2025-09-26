// For Next.js App Router: app/api/acars-map/route.ts
export async function GET() {
  const res = await fetch("https://jalvirtual.com/api/acars", {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    return new Response(JSON.stringify([]), { status: 500 });
  }
  const data = await res.json();
  // If needed, filter/map/sanitize the data here
  return new Response(JSON.stringify(data), { status: 200 });
}
