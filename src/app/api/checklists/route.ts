import { NextResponse } from "next/server";
import { getDb } from "@/lib/dbConnect";

const COLLECTION = "checklists"; // { pilotId, name, items:[{id,text,done,order}], updatedAt }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pilotId = (searchParams.get("pilotId") || "").toUpperCase();
  if (!pilotId) return NextResponse.json({ error: "pilotId required" }, { status: 400 });
  const db = await getDb();
  const docs = await db.collection(COLLECTION).find({ pilotId }).sort({ updatedAt: -1 }).toArray();
  return NextResponse.json({ data: docs });
}

export async function POST(req: Request) {
  const body = await req.json();
  const pilotId = (body?.pilotId || "").toUpperCase();
  if (!pilotId) return NextResponse.json({ error: "pilotId required" }, { status: 400 });
  const db = await getDb();
  const now = new Date();
  const doc = { pilotId, name: body.name ?? "Checklist", items: body.items ?? [], updatedAt: now, createdAt: now };
  const res = await db.collection(COLLECTION).insertOne(doc);
  return NextResponse.json({ data: { ...doc, _id: res.insertedId } });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const id = body?._id;
  if (!id) return NextResponse.json({ error: "_id required" }, { status: 400 });
  const { ObjectId } = await import("mongodb");
  const db = await getDb();
  const now = new Date();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: body.name, items: body.items, updatedAt: now } }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { ObjectId } = await import("mongodb");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const db = await getDb();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
