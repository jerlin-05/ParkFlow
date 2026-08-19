import "@/lib/init";

import { NextRequest, NextResponse } from "next/server";

import {
  createBookingToken,
  findBooking,
} from "@/lib/store";

import { sendDemoSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = findBooking(params.id);

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found." },
      { status: 404 }
    );
  }

  const token = createBookingToken(booking.id);

  const origin = new URL(req.url).origin;

  const bookingUrl =
    `${origin}/customer/booking/${booking.id}?token=${token}`;

  const message = [
    "ParkFlow — Booking Successful!",
    "",
    `Vehicle: ${booking.vehicle}`,
    `Slot: ${booking.slotLabel}`,
    `Amount: ₹${booking.amount}`,
    `Booking ID: ${booking.id}`,
    "",
    "View your booking:",
    bookingUrl,
    "",
    "Please proceed to the parking entrance.",
    "— ParkFlow",
  ].join("\n");

  sendDemoSms(booking.mobile, message);

  return NextResponse.json({
    success: true,
    booking,
    bookingUrl,
  });
}