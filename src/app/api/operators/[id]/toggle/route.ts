import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { toggleOperator } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const op = toggleOperator(params.id);
  if (!op) return NextResponse.json({ error: "Operator not found." }, { status: 404 });
  return NextResponse.json(op);
}
