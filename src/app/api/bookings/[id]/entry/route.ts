import "@/lib/init";

import { sendDemoSms } from "@/lib/sms";

import { NextRequest, NextResponse } from "next/server";

import {
  markEntry,
  state,
  markNotResponding,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // --------------------------------------------------
  // CHECK BOOKING
  // --------------------------------------------------

  const existingBooking = state.bookings.find(
    (booking) => booking.id === params.id
  );

  if (!existingBooking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 }
    );
  }

  // Remember the slot before entry/reassignment.
  const previousSlot = existingBooking.slotLabel;

  // --------------------------------------------------
  // CHECK FOR ACTIVE SENSOR INCIDENT
  // BEFORE MARKING ENTRY
  // --------------------------------------------------

  const activeIncident = state.incidents.find(
    (incident) =>
      incident.bookingId === existingBooking.id &&
      incident.status === "active"
  );

  // --------------------------------------------------
  // MARK QR ENTRY
  // --------------------------------------------------

  const booking = markEntry(params.id);

  if (!booking) {
    return NextResponse.json(
      { error: "Unable to start parking session." },
      { status: 400 }
    );
  }

  // --------------------------------------------------
  // CASE 1:
  // SENSOR INCIDENT EXISTS
  //
  // Customer scanned QR while security
  // had not resolved the problem.
  // --------------------------------------------------

  if (activeIncident) {
    console.log(
      `[ParkFlow] QR scanned while incident ${activeIncident.id} is active. Reassigning ${booking.id}.`
    );

    const result = markNotResponding(activeIncident.id);

    if (!result) {
      console.log(
        `[ParkFlow] Automatic reassignment failed for ${booking.id}.`
      );

      // Customer still entered, but no alternative slot
      // was available.
      sendDemoSms(
        booking.mobile,
        [
          "ParkFlow Alert",
          "",
          `Your assigned slot ${previousSlot} is unavailable.`,
          "Security has been notified.",
          "",
          "We could not assign another slot right now.",
          "Please contact security at the entry gate.",
        ].join("\n")
      );

      return NextResponse.json({
        booking,
        incident: activeIncident,
        reassigned: false,
      });
    }

    const newSlot = booking.slotLabel;

    // --------------------------------------------------
    // SEND REASSIGNMENT SMS
    // --------------------------------------------------

    sendDemoSms(
      booking.mobile,
      [
        "ParkFlow — Slot Reassigned",
        "",
        `Previous slot: ${previousSlot}`,
        `New slot: ${newSlot}`,
        "",
        "Your QR entry was successful.",
        "Please proceed to your new slot.",
        "Security has been notified.",
        "",
        "— ParkFlow",
      ].join("\n")
    );

    console.log(
      `[ParkFlow] Automatic reassignment completed for ${booking.id}: ${previousSlot} → ${newSlot}`
    );

    return NextResponse.json({
      booking,
      incident: activeIncident,
      reassigned: true,
      previousSlot,
      newSlot,
    });
  }

  // --------------------------------------------------
  // CASE 2:
  // NO SENSOR INCIDENT
  //
  // Normal QR entry.
  // --------------------------------------------------

  sendDemoSms(
    booking.mobile,
    [
      "ParkFlow — Entry Successful!",
      "",
      `Vehicle: ${booking.vehicle}`,
      `Slot: ${booking.slotLabel}`,
      `Entry time: ${new Date().toLocaleString()}`,
      "",
      "Your parking session has started.",
      "Please proceed to your assigned slot.",
      "",
      "— ParkFlow",
    ].join("\n")
  );

  console.log(
    `[ParkFlow] Normal entry completed for ${booking.id} at ${booking.slotLabel}`
  );

  return NextResponse.json({
    booking,
    reassigned: false,
  });
}