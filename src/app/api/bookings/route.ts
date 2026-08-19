import "@/lib/init";

import { NextRequest, NextResponse } from "next/server";

import {
  state,
  createBooking,
  createBookingToken,
} from "@/lib/store";

import { sendDemoSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

// ======================================================
// GET BOOKINGS
// ======================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const activeOnly = searchParams.get("activeOnly");

  let result = state.bookings;

  if (activeOnly === "true") {
    result = result.filter(
      (b) => b.status !== "completed"
    );
  }

  if (q) {
    const query = q.toUpperCase();

    result = result.filter(
      (b) =>
        b.vehicle.includes(query) ||
        b.id.toUpperCase().includes(query)
    );
  }

  return NextResponse.json(result);
}

// ======================================================
// CREATE BOOKING
// ======================================================

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Create the booking
  const result = createBooking(body);

  // Handle booking error
  if ("error" in result) {
    return NextResponse.json(
      {
        error: result.error,
      },
      {
        status: result.status,
      }
    );
  }

  const booking = result.booking;

  // ====================================================
  // CREATE SECURE BOOKING TOKEN
  // ====================================================

  const token = createBookingToken(booking.id);

  // ====================================================
  // CREATE CUSTOMER BOOKING URL
  // ====================================================

  const bookingUrl =
    `http://localhost:3000/customer/booking/${booking.id}?token=${token}`;

  // ====================================================
  // DEMO SMS — CONSOLE ONLY
  // ====================================================

  sendDemoSms(
    booking.mobile,
    [
      "ParkFlow — Booking Confirmed",
      "",
      "Your parking slot has been successfully booked.",
      "",
      `Booking ID: ${booking.id}`,
      `Vehicle: ${booking.vehicle}`,
      `Slot: ${booking.slotLabel}`,
      "",
      "View your booking:",
      bookingUrl,
      "",
      "Please proceed to the parking entrance.",
      "",
      "— ParkFlow",
    ].join("\n")
  );

  // ====================================================
  // SERVER LOG
  // ====================================================

  console.log(
    `[ParkFlow] Booking created: ${booking.id} | ${booking.vehicle} | ${booking.slotLabel}`
  );

  // ====================================================
  // RESPONSE
  // ====================================================

  return NextResponse.json(
    {
      booking,
    },
    {
      status: 201,
    }
  );
}