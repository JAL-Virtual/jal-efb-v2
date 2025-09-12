import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const COLLECTION = "notifications"; // { pilotId, title, body, level, read:boolean, createdAt }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pilotId = (searchParams.get("pilotId") || "").toUpperCase();
  if (!pilotId) return NextResponse.json({ error: "pilotId required" }, { status: 400 });
  const db = await getDb();
  const items = await db
    .collection(COLLECTION)
    .find({ pilotId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return NextResponse.json({ data: items });
}

export async function POST(req: Request) {
  const body = await req.json();
  const pilotId = (body?.pilotId || "").toUpperCase();
  if (!pilotId) return NextResponse.json({ error: "pilotId required" }, { status: 400 });
  const db = await getDb();
  const doc = {
    pilotId,
    title: body.title ?? "Message",
    body: body.body ?? "",
    level: body.level ?? "info",
    read: false,
    createdAt: new Date(),
  };
  await db.collection(COLLECTION).insertOne(doc);
  return NextResponse.json({ data: doc });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const ids: string[] = body?.ids ?? [];
  const { ObjectId } = await import("mongodb");
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ ok: true });
  const db = await getDb();
  await db.collection(COLLECTION).updateMany(
    { _id: { $in: ids.map((x) => new ObjectId(x)) } },
    { $set: { read: true } }
  );
  return NextResponse.json({ ok: true });
}
