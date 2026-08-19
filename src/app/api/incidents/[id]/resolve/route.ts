import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { resolveIncident } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const incident = resolveIncident(params.id);
  if (!incident) return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  return NextResponse.json({ incident });
}
