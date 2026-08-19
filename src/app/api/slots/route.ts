import "@/lib/init";
import { NextResponse } from "next/server";
import { publicSlots } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(publicSlots());
}
