import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { removeEmployee } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  removeEmployee(params.id);
  return NextResponse.json({ deleted: true });
}
