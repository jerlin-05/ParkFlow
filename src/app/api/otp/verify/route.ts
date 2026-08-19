import "@/lib/init";
import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { mobile, code } = await req.json();
  const verified = verifyOtp(mobile, code);
  if (!verified) return NextResponse.json({ verified: false }, { status: 400 });
  return NextResponse.json({ verified: true });
}
