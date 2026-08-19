import "@/lib/init";
import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/store";
import { getClientCount } from "@/lib/bus";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPlatformStats(getClientCount()));
}
