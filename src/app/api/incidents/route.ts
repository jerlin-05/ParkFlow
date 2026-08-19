import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { state } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("activeOnly");
  let result = state.incidents;
  if (activeOnly === "true") result = result.filter((i) => i.status === "active");
  return NextResponse.json(result);
}
