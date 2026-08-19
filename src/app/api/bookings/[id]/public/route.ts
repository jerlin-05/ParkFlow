import "@/lib/init";

import { NextRequest, NextResponse } from "next/server";
import { findBookingByToken } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);

  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      {
        error: "Booking access token is required.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

const booking = findBookingByToken(
  params.id,
  token
);

if (!booking) {
  return NextResponse.json(
    { error: "Invalid or expired booking link." },
    { status: 403 }
  );
}

// Once the parking session is completed,
// the public booking link is no longer valid.
if (booking.status === "completed") {
  return NextResponse.json(
    {
      error:
        "This booking link has expired because the parking session has ended.",
    },
    { status: 410 }
  );
}
  return NextResponse.json(
    {
      id: booking.id,
      vehicle: booking.vehicle,

      slotIndex: booking.slotIndex,
      slotLabel: booking.slotLabel,

      amount: booking.amount,
      status: booking.status,
      payMethod: booking.payMethod,

      createdAt: booking.createdAt,
      entryTime: booking.entryTime,
      exitTime: booking.exitTime,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}