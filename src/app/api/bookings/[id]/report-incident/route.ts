import "@/lib/init";

import { NextRequest, NextResponse } from "next/server";

import {
  findBooking,
  createIncident,
  markNotResponding,
  state,
} from "@/lib/store";

import { sendDemoSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = findBooking(params.id);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 }
    );
  }

  // --------------------------------------------------
  // REPORT BUTTON WORKS ONLY AFTER QR ENTRY
  // --------------------------------------------------

  if (booking.status !== "active") {
    return NextResponse.json(
      {
        error:
          "You can report an occupied slot only after your QR has been scanned.",
      },
      { status: 409 }
    );
  }

  // --------------------------------------------------
  // DON'T CREATE DUPLICATE INCIDENTS
  // --------------------------------------------------

  const existingIncident = state.incidents.find(
    (incident) =>
      incident.bookingId === booking.id &&
      incident.status === "active"
  );

  if (existingIncident) {
    return NextResponse.json(
      {
        incident: existingIncident,
        message: "An incident is already being handled.",
        reassignmentIn: 7,
      },
      { status: 200 }
    );
  }

  // --------------------------------------------------
  // CREATE INCIDENT
  // --------------------------------------------------

  const previousSlot = booking.slotLabel;

  const incident = createIncident(booking, "high");

  console.log(
    `[ParkFlow] Slot occupied reported: ${booking.id} → ${previousSlot}`
  );

  // --------------------------------------------------
  // AUTOMATIC REASSIGNMENT AFTER 7 SECONDS
  // --------------------------------------------------

  setTimeout(() => {
    const result = markNotResponding(incident.id);

    if (!result) {
      console.log(
        `[ParkFlow] Automatic reassignment failed for ${incident.bookingId}`
      );
      return;
    }

    const newSlot = booking.slotLabel;

    // --------------------------------------------------
    // SEND NEW SLOT SMS
    // --------------------------------------------------

    sendDemoSms(
      booking.mobile,
      `ParkFlow — Slot Reassigned

Previous slot: ${previousSlot}
New slot: ${newSlot}

Please proceed to your new slot.
Security has been notified.`
    );

    console.log(
      `[ParkFlow] Automatic reassignment completed for ${incident.bookingId}: ${previousSlot} → ${newSlot}`
    );
  }, 7000);

  return NextResponse.json(
    {
      incident,
      message:
        "Incident reported. Security has been notified. Automatic reassignment will occur in 7 seconds.",
      reassignmentIn: 7,
    },
    { status: 201 }
  );
}