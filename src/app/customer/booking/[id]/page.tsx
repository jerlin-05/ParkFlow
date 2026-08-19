"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Booking = {
  id: string;
  vehicle: string;
  slotLabel: string;
  amount: number;
  status: string;
  payMethod: string;
  createdAt: string;
  entryTime: string | null;
  exitTime: string | null;
};

export default function BookingPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [countdown, setCountdown] = useState(0);


  useEffect(() => {
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const tokenValue = searchParams.get("token");

    if (typeof tokenValue !== "string" || tokenValue.length === 0) {
      setError("Invalid booking link.");
      setLoading(false);
      return;
    }

    // From this point onward TypeScript knows this is definitely a string.
    const accessToken: string = tokenValue;

    let cancelled = false;

    async function loadBooking() {
      try {
        const res = await fetch(
          `/api/bookings/${params.id}/public?token=${encodeURIComponent(
            accessToken
          )}&t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Unable to load booking."
          );
        }

        if (!cancelled) {
          setBooking(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load booking."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // Load immediately when the page opens.
    loadBooking();

    // Check for booking changes every 2 seconds.
    const interval = setInterval(() => {
      loadBooking();
    }, 2000);

    // Stop polling when the customer leaves the page.
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-asphalt text-fog">
        Loading booking...
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-asphalt px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-red">
            Booking link unavailable
          </h1>

          <p className="mt-2 text-mist">
            {error || "This booking could not be found."}
          </p>

          <Link
            href="/customer"
            className="mt-6 inline-flex rounded-lg bg-amber px-5 py-3 font-semibold text-asphalt"
          >
            Go to ParkFlow
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-asphalt px-6 py-12 text-fog">
      <div className="mx-auto max-w-2xl">

        <Link
          href="/customer"
          className="mb-8 inline-flex items-center gap-2 text-mist hover:text-fog"
        >
          <ArrowLeft size={16} />
          ParkFlow
        </Link>

        <div className="rounded-2xl border border-line-strong bg-panel p-7">

          <div className="flex items-center gap-3">
            <CheckCircle2
              className="text-green"
              size={28}
            />

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-green">
                Booking confirmed
              </p>

              <h1 className="mt-1 font-display text-2xl font-bold">
                Your parking slot is reserved
              </h1>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            <Info
              label="Booking ID"
              value={booking.id}
            />

            <Info
              label="Vehicle"
              value={booking.vehicle}
            />

            <div className="rounded-xl border border-green/30 bg-green/[0.06] p-5">
              <p className="text-xs uppercase tracking-wide text-mist">
                Assigned slot
              </p>

              <p className="mt-2 font-display text-4xl font-black text-green">
                {booking.slotLabel}
              </p>
            </div>

            <Info
              label="Amount"
              value={`₹${booking.amount}`}
            />

            <Info
              label="Payment"
              value={booking.payMethod}
            />

            <Info
              label="Status"
              value={booking.status.toUpperCase()}
            />

          </div>
          {/* ENTRY QR CODE */}
          <div className="mt-8 rounded-xl border border-line bg-black/20 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-green">
              Entry QR Ticket
            </p>

            <p className="mt-2 text-sm text-mist">
              Show this QR code at the entry gate
            </p>

            <div className="mx-auto mt-5 flex w-fit rounded-2xl bg-white p-4">
              <QRCodeSVG
                value={booking.id}
                size={220}
                level="M"
                includeMargin
              />
            </div>

            <p className="mt-4 font-mono text-xs text-mist">
              Booking ID: {booking.id}
            </p>

            <p className="mt-2 text-xs leading-5 text-mist">
              Your parking session starts only after this QR
              is successfully scanned at the entry gate.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-amber/30 bg-amber/[0.06] p-5">
            <div className="mt-6 rounded-xl border border-red/30 bg-red/[0.04] p-5">

              <p className="font-semibold text-red">
                Is another vehicle occupying your slot?
              </p>

              <p className="mt-1 text-sm leading-6 text-mist">
                Report the problem and ParkFlow will notify
                security and automatically find another
                available slot.
              </p>

              {booking.status === "active" ? (
                <button
                  type="button"
                  onClick={reportSlotOccupied}
                  disabled={reporting}
                  className="mt-4 w-full rounded-lg border border-red/40 bg-red/[0.08] px-4 py-3 font-semibold text-red transition hover:bg-red/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reporting
                    ? `Resolving... ${countdown}`
                    : "Report slot occupied"}
                </button>
              ) : (
                <div className="mt-4 rounded-lg border border-line p-3 text-sm text-mist">
                  This option becomes available after your QR
                  is successfully scanned at the entry gate.
                </div>
              )}

              {reportMessage && (
                <div className="mt-4 rounded-lg border border-green/30 bg-green/[0.06] p-4 text-sm leading-6 text-green">
                  <div className="font-semibold">
                    {countdown > 0
                      ? `🔄 Resolving slot conflict... ${countdown}s`
                      : "✓ Slot update"}
                  </div>

                  <p className="mt-1">
                    {reportMessage}
                  </p>
                </div>
              )}

            </div>

            <div className="flex gap-3">

              <Clock3
                size={18}
                className="mt-0.5 text-amber"
              />

              <div>



                <p className="mt-1 text-sm leading-6 text-mist">
                  Show your booking QR at the entry gate.
                  Your parking session starts after the QR
                  is successfully scanned.
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
  async function reportSlotOccupied() {
    if (!booking || reporting) return;

    setReporting(true);
    setReportMessage("");
    setCountdown(7);

    try {
      const res = await fetch(
        `/api/bookings/${booking.id}/report-incident`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setReportMessage(
          data.error || "Unable to report the slot."
        );
        setReporting(false);
        setCountdown(0);
        return;
      }

      setReportMessage(
        "Security has been notified. We are resolving your slot..."
      );

      // Start 7-second countdown
      for (let seconds = 7; seconds >= 1; seconds--) {
        setCountdown(seconds);

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }

      // Give backend a moment to finish reassignment
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      // Get the latest booking information
      const token = new URLSearchParams(
        window.location.search
      ).get("token");

      if (!token) {
        setReportMessage(
          "Your slot was reported, but the booking link is invalid."
        );
        return;
      }

      const bookingRes = await fetch(
        `/api/bookings/${booking.id}/public?token=${encodeURIComponent(
          token
        )}`,
        {
          cache: "no-store",
        }
      );

      const updatedBooking = await bookingRes.json();

      if (bookingRes.ok) {
        setBooking(updatedBooking);

        setReportMessage(
          `Your slot has been changed to ${updatedBooking.slotLabel}. Please proceed to your new slot.`
        );
      } else {
        setReportMessage(
          "Incident resolved. Please check your booking for the new slot."
        );
      }
    } catch {
      setReportMessage(
        "Unable to contact ParkFlow. Please try again."
      );
    } finally {
      setReporting(false);
      setCountdown(0);
    }
  }
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-line p-5">

      <p className="text-xs uppercase tracking-wide text-mist">
        {label}
      </p>

      <p className="mt-2 font-mono text-sm text-fog">
        {value}
      </p>

    </div>
  );
}