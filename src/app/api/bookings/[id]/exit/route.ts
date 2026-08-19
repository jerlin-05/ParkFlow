import "@/lib/init";

import { NextRequest, NextResponse } from "next/server";

import { markExit } from "@/lib/store";
import { sendDemoSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = markExit(params.id);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 }
    );
  }

  // Calculate parking session duration
  let sessionDuration = "Not available";

  if (booking.entryTime && booking.exitTime) {
    const entry = new Date(booking.entryTime).getTime();
    const exit = new Date(booking.exitTime).getTime();

    const durationMs = Math.max(0, exit - entry);
    const totalSeconds = Math.floor(durationMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      sessionDuration = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      sessionDuration = `${minutes}m ${seconds}s`;
    } else {
      sessionDuration = `${seconds}s`;
    }
  }

  // Send exit SMS
  sendDemoSms(
    booking.mobile,
    `ParkFlow — Parking Session Completed

Your parking session has ended successfully.

Booking ID: ${booking.id}
Slot: ${booking.slotLabel}

Entry time: ${booking.entryTime
      ? new Date(booking.entryTime).toLocaleTimeString()
      : "N/A"
    }

Exit time: ${booking.exitTime
      ? new Date(booking.exitTime).toLocaleTimeString()
      : "N/A"
    }

Session duration: ${sessionDuration}

Thank you for using ParkFlow.
Drive safely!`
  );

  console.log(
    `[ParkFlow] Parking session completed: ${booking.id} (${sessionDuration})`
  );

  return NextResponse.json({
    booking,
    sessionDuration,
  });
}