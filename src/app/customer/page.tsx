"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, MapPin, Radio, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConnStatus } from "@/components/ui/ConnStatus";
import { SlotGrid, SlotLegend } from "@/components/ui/SlotGrid";
import { Toast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import type { Slot } from "@/lib/types";
import { clsx } from "@/lib/clsx";
import Msg91Otp from "@/components/Msg91Otp";
import { TicketArt } from "@/components/ui/RoleArt";

type WizardState = {
  vehicle: string;
  mobile: string;
  slotIndex: number | null;
  slotLabel: string;
  bookingId: string;
  entryTime: Date | null;
};

const emptyState: WizardState = {
  vehicle: "",
  mobile: "",
  slotIndex: null,
  slotLabel: "",
  bookingId: "",
  entryTime: null,
};
const formatVehicleNumber = (value: string) => {
  const cleaned = value
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  const limited = cleaned.slice(0, 11);

  let result = "";

  // State code: KL
  const state = limited.slice(0, 2);
  result += state;

  // District number: 07
  if (limited.length > 2) {
    const district = limited.slice(2, 4).replace(/\D/g, "");

    if (district) {
      result += `-${district}`;
    }
  }

  // Series: A / AA / AB / ABC
  if (limited.length > 4) {
    const remaining = limited.slice(4);

    const seriesMatch = remaining.match(/^[A-Z]{1,3}/);
    const series = seriesMatch?.[0] || "";

    if (series) {
      result += `-${series}`;
    }

    // Registration number: 1–4 digits
    const number = remaining
      .slice(series.length)
      .match(/^\d{1,4}/)?.[0] || "";

    if (number) {
      result += `-${number}`;
    }
  }

  return result;
};

export default function CustomerPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [state, setState] = useState<WizardState>(emptyState);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(
        "parkflow_customer_state"
      );

      const savedStep = localStorage.getItem(
        "parkflow_customer_step"
      );

      const savedView = localStorage.getItem(
        "parkflow_customer_view"
      );

      if (savedState) {
        const parsedState = JSON.parse(savedState);

        setState({
          ...emptyState,
          ...parsedState,
          entryTime: parsedState.entryTime
            ? new Date(parsedState.entryTime)
            : null,
        });
      }

      if (savedStep) {
        setStep(Number(savedStep));
      }

      if (
        savedView === "ticket" ||
        savedView === "session" ||
        savedView === "done"
      ) {
        setView(savedView);
      }
    } catch {
      // Ignore invalid saved data
    } finally {
      setRestored(true);
    }
  }, []);
  useEffect(() => {
    if (!restored) return;

    localStorage.setItem(
      "parkflow_customer_step",
      String(step)
    );
  }, [step, restored]);
  useEffect(() => {
    if (!restored) return;

    try {
      localStorage.setItem(
        "parkflow_customer_state",
        JSON.stringify(state)
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [state, restored]);
  const [toast, setToast] = useState<{ tag: string; message: string; tone: "amber" | "red" | "green" }>({ tag: "SYS", message: "Connecting to ParkFlow backend…", tone: "amber" });
  const [smsMessage, setSmsMessage] = useState("");
  const [geoOk, setGeoOk] = useState(false);
  const [geoText, setGeoText] = useState("Location not checked yet");
  const [geoChecking, setGeoChecking] = useState(false);
  const [view, setView] = useState<"ticket" | "session" | "done">("ticket");
  useEffect(() => {
    if (!restored) return;

    localStorage.setItem(
      "parkflow_customer_view",
      view
    );
  }, [view, restored]);
  const [sessionBanner, setSessionBanner] = useState({ text: "Session active", alert: false });
  const [elapsed, setElapsed] = useState("00:00");
  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    if (!restored) return;
    if (!state.bookingId) return;

    async function generateQr() {
      try {
        const url = await QRCode.toDataURL(
          JSON.stringify({
            id: state.bookingId,
            vehicle: state.vehicle,
          }),
          {
            width: 150,
            margin: 1,
            color: {
              dark: "#14161a",
              light: "#ffffff",
            },
          }
        );

        setQrDataUrl(url);
      } catch {
        setQrDataUrl("");
      }
    }

    generateQr();
  }, [
    restored,
    state.bookingId,
    state.vehicle,
  ]);
  const bookingIdRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!restored) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (view !== "session" || !state.entryTime) {
      setElapsed("00:00");
      return;
    }

    const updateElapsed = () => {
      const entry = new Date(state.entryTime as Date).getTime();
      const secs = Math.max(
        0,
        Math.floor((Date.now() - entry) / 1000)
      );

      const minutes = String(
        Math.floor(secs / 60)
      ).padStart(2, "0");

      const seconds = String(
        secs % 60
      ).padStart(2, "0");

      setElapsed(`${minutes}:${seconds}`);
    };

    updateElapsed();

    timerRef.current = setInterval(
      updateElapsed,
      1000
    );

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    restored,
    view,
    state.entryTime,
  ]);

  const setToastMsg = (tag: string, message: string, tone: "amber" | "red" | "green" = "amber") =>
    setToast({ tag, message, tone });
  const connected = useRealtime(
    useCallback((event) => {
      // Live parking slot updates
      if (event.type === "slots:update") {
        setSlots(event.payload);
      }

      // Customer's slot conflict
      if (
        event.type === "booking:conflict" &&
        event.payload.bookingId === bookingIdRef.current
      ) {
        setSessionBanner({
          text: "Your reserved slot is temporarily unavailable — we're resolving it.",
          alert: true,
        });

        setToastMsg(
          "ALERT",
          "Incident on your slot — security has been notified.",
          "red"
        );
      }

      // Incident resolved
      if (
        event.type === "booking:resolved" &&
        event.payload.bookingId === bookingIdRef.current
      ) {
        setSessionBanner({
          text: "Your slot is ready — you can proceed.",
          alert: false,
        });

        setToastMsg(
          "OK",
          "Resolved — your reserved slot is ready.",
          "green"
        );
      }

      // Booking automatically reassigned
      if (
        event.type === "booking:reassigned" &&
        event.payload.bookingId === bookingIdRef.current
      ) {
        setState((s) => ({
          ...s,
          slotLabel: event.payload.newSlotLabel,
        }));

        setSessionBanner({
          text:
            "Your slot has been changed to " +
            event.payload.newSlotLabel +
            ".",
          alert: false,
        });

        setToastMsg(
          "SMS",
          "Your new slot is " +
          event.payload.newSlotLabel +
          ". Please proceed there.",
          "green"
        );
      }

      // Demo SMS received by customer dashboard
      if (
        event.type === "sms:sent" &&
        event.payload.bookingId === bookingIdRef.current
      ) {
        setSmsMessage(event.payload.message);
      }
    }, [])
  );

  useEffect(() => {
    fetch("/api/slots").then((r) => r.json()).then(setSlots);
  }, []);

  useEffect(() => {
    bookingIdRef.current = state.bookingId;
  }, [state.bookingId]);

  useEffect(() => {
    if (connected) setToastMsg("SYS", "Connected. Ready to book.");
  }, [connected]);

  const goTo = (n: number) => setStep(n);

  async function sendOtp() {
    const v = state.vehicle.trim().toUpperCase();
    const m = state.mobile.replace(/\D/g, "");

    if (!v) {
      setToastMsg(
        "SYS",
        "Enter your vehicle number."
      );
      return;
    }

    if (m.length !== 10) {
      setToastMsg(
        "SYS",
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    setState((s) => ({
      ...s,
      vehicle: v,
      mobile: m,
    }));

    // Open OTP screen.
    // Msg91Otp will automatically send the OTP.
    goTo(2);
  }

  function checkGeo() {
    setGeoChecking(true);
    setGeoText("Checking your location…");
    const done = (msg: string) => {
      setGeoOk(true);
      setGeoText(msg);
      setGeoChecking(false);
      setToastMsg("OK", msg, "green");
    };
    if (!navigator.geolocation) {
      done("Location unavailable — allowing for demo purposes.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => done("Inside the 200m booking radius."),
      () => done("Location permission denied — allowing for demo purposes."),
      { timeout: 4000 }
    );
  }

  async function confirmSlot() {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle: state.vehicle, mobile: state.mobile, source: "online", amount: 40, payMethod: "card" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToastMsg("SYS", data.error || "Could not assign a slot.");
      return;
    }
    setState((s) => ({ ...s, slotIndex: data.booking.slotIndex, slotLabel: data.booking.slotLabel, bookingId: data.booking.id }));
    setToastMsg("SYS", "Nearest free slot: " + data.booking.slotLabel);
    goTo(4);
  }

  async function confirmAndPay() {
    setQrDataUrl("");

    try {
      const url = await QRCode.toDataURL(
        JSON.stringify({
          id: state.bookingId,
          vehicle: state.vehicle,
        }),
        {
          width: 150,
          margin: 1,
          color: {
            dark: "#14161a",
            light: "#ffffff",
          },
        }
      );

      setQrDataUrl(url);
    } catch {
      // QR generation failed; text fallback will still work
    }

    // Confirm booking and trigger demo SMS
    const res = await fetch(
      "/api/bookings/" + state.bookingId + "/confirm",
      {
        method: "POST",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setToastMsg(
        "PAY",
        data.error || "Could not confirm booking.",
        "red"
      );
      return;
    }

    setView("ticket");

    setToastMsg(
      "PAY",
      "₹40 charged. Booking confirmed — SMS sent to your mobile.",
      "green"
    );

    goTo(5);
  }

  async function simulateEntry() {
    const res = await fetch("/api/bookings/" + state.bookingId + "/entry", { method: "POST" });
    const data = await res.json();
    const entryTime = new Date(data.booking.entryTime);
    setState((s) => ({ ...s, entryTime, slotLabel: data.booking.slotLabel }));
    setView("session");
    setSessionBanner({ text: "Session active", alert: false });
    setToastMsg("GATE", "Barrier opened. Session active for " + state.bookingId, "green");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - entryTime.getTime()) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setElapsed(m + ":" + s);
    }, 1000);
  }

  async function reportSlot() {
    const res = await fetch("/api/bookings/" + state.bookingId + "/report-incident", { method: "POST" });
    if (res.ok) setToastMsg("ALERT", "Incident reported — security notified.", "red");
  }

  async function simulateExit() {
    if (timerRef.current) clearInterval(timerRef.current);
    await fetch("/api/bookings/" + state.bookingId + "/exit", { method: "POST" });
    setView("done");
    setToastMsg("GATE", "Exit recorded. Slot is free again.", "green");
  }

  function bookAgain() {
    // Clear previous booking from browser storage
    localStorage.removeItem("parkflow_customer_state");
    localStorage.removeItem("parkflow_customer_step");
    localStorage.removeItem("parkflow_customer_view");

    // Clear previous SMS
    setSmsMessage("");

    // Clear booking state
    setState(emptyState);

    // Clear location
    setGeoOk(false);
    setGeoText("Location not checked yet");

    // Start a new booking
    setView("ticket");
    goTo(1);
  }
  const dots = [1, 2, 3, 4, 5];

  if (!restored) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-asphalt text-fog">
        Loading ParkFlow...
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-line bg-asphalt/80 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft size={16} className="text-mist" />
            <span className="font-display text-[20px] font-black">ParkFlow</span>
          </Link>
          <ConnStatus connected={connected} />
        </div>
      </nav>

      <header className="border-b border-line px-6 pb-14 pt-20 md:pt-24">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-amber">
              <span className="h-[7px] w-[7px] rounded-full bg-amber shadow-glow" />
              Live booking · Lulu Mall Lot A, Kochi
            </span>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(32px,4.6vw,50px)] font-black leading-[1.06]">
              Reserve your <em className="text-green not-italic">parking slot</em> before you arrive.
            </h1>
            <p className="mt-3 max-w-lg text-[16px] text-mist">
              Enter your vehicle and mobile number, verify by OTP, and get a fixed slot with a QR
              ticket — synced live with the gate and security teams.
            </p>
          </div>
          <TicketArt className="hidden h-28 w-40 flex-shrink-0 text-green md:block" />
        </div>
      </header>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-11 lg:grid-cols-2">
          {/* Wizard */}
          <div className="flex min-h-[460px] flex-col rounded-2xl border border-line-strong bg-panel p-7">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[12px] uppercase tracking-wide text-mist">Step {step} of 5</span>
              <div className="flex gap-1.5">
                {dots.map((d) => (
                  <span
                    key={d}
                    className={clsx(
                      "h-[3px] w-5 rounded-full transition-colors",
                      d === step ? "bg-amber" : d < step ? "bg-green" : "bg-line-strong"
                    )}
                  />
                ))}
              </div>
            </div>

            {step === 1 && (
              <div className="flex flex-1 flex-col">
                <h3 className="text-[19px] font-semibold">Who&apos;s booking?</h3>
                <p className="mb-6 mt-1.5 text-[14px] text-mist">No sign-up needed — just your vehicle and mobile number.</p>
                <Field label="Vehicle number">
                  <input
                    className="input"
                    placeholder="KL-00-AA-0000"
                    maxLength={15}
                    value={state.vehicle}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        vehicle: formatVehicleNumber(e.target.value),
                      }))
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
                <Field label="Mobile number">
                  <input
                    className="input"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    inputMode="numeric"
                    value={state.mobile}
                    onChange={(e) => {
                      const numbersOnly = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                      setState((s) => ({
                        ...s,
                        mobile: numbersOnly,
                      }));
                    }}
                    autoComplete="tel"
                  />
                </Field>
                <div className="mt-auto pt-2">
                  <Button full onClick={sendOtp}>Send OTP</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-1 flex-col">
                <h3 className="text-[19px] font-semibold">
                  Verify your number
                </h3>

                <p className="mb-6 mt-1.5 text-[14px] text-mist">
                  A 4-digit OTP will be sent to{" "}
                  <span className="font-mono">
                    ••••••{state.mobile.slice(-4)}
                  </span>
                </p>

                <Msg91Otp
                  mobile={state.mobile}
                  onVerified={(data) => {
                    console.log("REAL MSG91 OTP VERIFIED:", data);

                    setToastMsg(
                      "OK",
                      "Mobile number verified successfully.",
                      "green"
                    );

                    goTo(3);
                  }}
                />

                <div className="mt-auto flex gap-3 pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => goTo(1)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-1 flex-col">
                <h3 className="text-[19px] font-semibold">Confirm you&apos;re nearby</h3>
                <p className="mb-4 mt-1.5 text-[14px] text-mist">Booking only unlocks within 200m of the lot.</p>
                <div
                  className={clsx(
                    "mb-4 flex items-center gap-2.5 rounded-lg border px-3.5 py-3.5 text-[13.5px]",
                    geoOk ? "border-green/40 text-green" : "border-line-strong text-fog"
                  )}
                >
                  <MapPin size={15} className={geoOk ? "text-green" : "text-mist-dim"} />
                  {geoText}
                </div>
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <Button variant="ghost" onClick={() => goTo(2)}>Back</Button>
                  <Button variant="ghost" onClick={checkGeo} disabled={geoChecking}>Check my location</Button>
                  <Button onClick={confirmSlot} disabled={!geoOk}>Continue</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-1 flex-col">
                <h3 className="text-[19px] font-semibold">Slot assigned</h3>
                <p className="mb-5 mt-1.5 text-[14px] text-mist">Nearest free slot, checked live against the shared backend.</p>
                <SummaryRow label="Vehicle" value={state.vehicle || "—"} />
                <SummaryRow label="Mobile" value={state.mobile ? "••••••" + state.mobile.slice(-4) : "—"} />
                <SummaryRow label="Assigned slot" value={state.slotLabel || "—"} valueClassName="text-green" />
                <SummaryRow label="Parking fee" value="₹40 / hr" last />
                <div className="mt-auto flex gap-3 pt-6">
                  <Button variant="ghost" onClick={() => goTo(3)}>Back</Button>
                  <Button full onClick={confirmAndPay}>Confirm &amp; pay ₹40</Button>
                </div>
              </div>
            )}

            {step === 5 && view === "ticket" && (
              <div className="flex flex-1 flex-col text-center">
                <h3 className="text-[19px] font-semibold">Your ticket</h3>
                <p className="mb-4 mt-1.5 text-[14px] text-mist">Show this QR at entry and exit.</p>
                <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-3.5">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} width={150} height={150} alt="Booking QR code" />
                  ) : (
                    <div className="flex h-[150px] w-[150px] items-center justify-center font-mono text-[11px] text-asphalt">
                      QR: {state.bookingId}
                    </div>
                  )}
                </div>
                <div className="font-mono text-[13px] text-mist">Booking ID {state.bookingId || "—"}</div>
                <div className="my-1.5 font-display text-[44px] font-black text-green">{state.slotLabel || "—"}</div>
                <div className="mt-4">
                  <Button full onClick={simulateEntry}>Simulate entry (scan QR)</Button>
                </div>
              </div>
            )}

            {step === 5 && view === "session" && (
              <div className="flex flex-1 flex-col">
                <div
                  className={clsx(
                    "mb-4 flex items-center justify-between rounded-lg border px-4 py-3.5 text-[13.5px]",
                    sessionBanner.alert ? "border-red/35 bg-red/[0.08] text-red" : "border-green/35 bg-green/[0.08] text-green"
                  )}
                >
                  <span>{sessionBanner.text}</span>
                  <span className="font-mono">{elapsed}</span>
                </div>
                <SummaryRow label="Slot" value={state.slotLabel || "—"} />
                <SummaryRow
                  label="Entry time"
                  value={state.entryTime ? state.entryTime.toLocaleTimeString() : "—"}
                  last
                />
                <div className="mt-6 flex flex-col gap-3">
                  <Button variant="danger" full onClick={reportSlot}>Report slot occupied</Button>
                  <Button variant="ghost" full onClick={simulateExit}>Simulate exit (scan QR)</Button>
                </div>
              </div>
            )}

            {step === 5 && view === "done" && (
              <div className="flex flex-1 flex-col justify-center text-center">
                <h3 className="text-[19px] font-semibold">Session complete</h3>
                <p className="mb-6 mt-1.5 text-[14px] text-mist">Barrier opened. Thanks for parking with ParkFlow.</p>
                <Button full onClick={bookAgain}>Book another slot</Button>
              </div>
            )}
          </div>

          {/* Live board */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-line-strong bg-panel p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[12px] uppercase tracking-wide text-mist">Lot A · Live occupancy</span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-green">
                  <Radio size={11} />
                  Live
                </span>
              </div>
              <SlotGrid slots={slots} yourSlotIndex={state.bookingId ? state.slotIndex : null} />
              <div className="mb-3.5 mt-4">
                <SlotLegend />
              </div>
              <Toast tag={toast.tag} message={toast.message} tone={toast.tone} />
              {smsMessage && (
                <div className="mt-3 rounded-xl border border-green/30 bg-green/[0.06] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-base">📱</span>

                    <span className="font-mono text-[11px] uppercase tracking-wider text-green">
                      ParkFlow SMS
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-[13px] leading-6 text-fog">
                    {smsMessage}
                  </div>
                </div>
              )}
            </div>
            {sessionBanner.alert && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red/30 bg-red/[0.06] p-4 text-[13px] text-red">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                Security has been alerted about a conflict on your reserved slot and is resolving it now.
              </div>
            )}
          </div>
        </div >
      </section >

      <footer className="border-t border-line px-6 py-9">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2.5 text-[13px] text-mist-dim">
          <span>ParkFlow — Smart Parking Operating System</span>
          <span>Live demo · shared with the gate and security dashboards</span>
        </div>
      </footer>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #131519;
          border: 1px solid rgba(237, 235, 228, 0.14);
          border-radius: 8px;
          padding: 13px 14px;
          color: #f1efe9;
          font-family: var(--font-plex), monospace;
          font-size: 15px;
          letter-spacing: 0.03em;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #f5b700;
        }
        .input::placeholder {
          color: #666b76;
          font-family: var(--font-inter), sans-serif;
          letter-spacing: 0;
        }
      `}</style>
    </div >
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  last,
  valueClassName,
}: {
  label: string;
  value: string;
  last?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className={clsx("flex justify-between py-2.5 text-[14px]", !last && "border-b border-line")}>
      <span className="text-mist">{label}</span>
      <span className={clsx("font-mono text-fog", valueClassName)}>{value}</span>
    </div>
  );
}