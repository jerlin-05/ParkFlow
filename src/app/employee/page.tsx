"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { DoorOpen, Search, Radio, ArrowLeftRight, IndianRupee, Users, ParkingSquare } from "lucide-react";
import { DashboardShell, NavItem } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { SlotGrid, SlotLegend } from "@/components/ui/SlotGrid";
import { Toast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import type { Booking, Slot, Stats } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const navItems: NavItem[] = [
  { key: "booking", label: "New walk-in booking", icon: ParkingSquare },
  { key: "search", label: "Search booking", icon: Search },
  { key: "gate", label: "Gate control", icon: DoorOpen },
  { key: "occupancy", label: "Live occupancy", icon: Radio },
];

export default function EmployeePage() {
  const [panel, setPanel] = useState("booking");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("40");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "upi">("cash");
  const [toast, setToast] = useState<{ tag: string; message: string; tone: "amber" | "red" | "green" }>({ tag: "SYS", message: "Enter vehicle & mobile, then print a ticket.", tone: "amber" });
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [receiptQr, setReceiptQr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [gate, setGate] = useState({ entry: false, exit: false });
  const [gateLog, setGateLog] = useState<{ msg: string; time: string }[]>([]);
  const gateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
      const district = limited
        .slice(2, 4)
        .replace(/\D/g, "");

      if (district) {
        result += `-${district}`;
      }
    }

    // Series: A / AA / AB / ABC
    if (limited.length > 4) {
      const remaining = limited.slice(4);

      const seriesMatch =
        remaining.match(/^[A-Z]{1,3}/);

      const series =
        seriesMatch?.[0] || "";

      if (series) {
        result += `-${series}`;
      }

      // Registration number: 1–4 digits
      const number =
        remaining
          .slice(series.length)
          .match(/^\d{1,4}/)?.[0] || "";

      if (number) {
        result += `-${number}`;
      }
    }

    return result;
  };
  const setBookingToast = (tag: string, message: string, tone: "amber" | "red" | "green" = "amber") =>
    setToast({ tag, message, tone });

  const refreshStats = useCallback(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const refreshSearch = useCallback((q: string) => {
    fetch("/api/bookings" + (q ? "?q=" + encodeURIComponent(q) : ""))
      .then((r) => r.json())
      .then(setSearchResults);
  }, []);

  const connected = useRealtime(
    useCallback(
      (event) => {
        if (event.type === "slots:update") setSlots(event.payload);
        if (event.type === "booking:new" || event.type === "booking:update") {
          refreshStats();
          if (panel === "search") refreshSearch(searchQuery);
        }
      },
      [panel, searchQuery, refreshStats, refreshSearch]
    )
  );

  useEffect(() => {
    fetch("/api/slots").then((r) => r.json()).then(setSlots);
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (panel === "search") refreshSearch(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  useEffect(() => {
    if (panel === "search") {
      const t = setTimeout(() => refreshSearch(searchQuery), 200);
      return () => clearTimeout(t);
    }
  }, [searchQuery, panel, refreshSearch]);

  function logGate(msg: string) {
    setGateLog((prev) => [{ msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 30));
  }

  function triggerGate(which: "entry" | "exit", note: string) {
    setGate((g) => ({ ...g, [which]: true }));
    logGate((which === "entry" ? "Entry" : "Exit") + " barrier opened — " + note);
    if (gateTimers.current[which]) clearTimeout(gateTimers.current[which]);
    gateTimers.current[which] = setTimeout(() => setGate((g) => ({ ...g, [which]: false })), 2200);
  }

  async function printTicket() {
    const v = vehicle.trim();
    const m = mobile.trim();
    if (!v || m.length !== 10) {
      setBookingToast(
        "SYS",
        "Enter a valid 10-digit mobile number.",
        "red"
      );
      return;
    }
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: v,
        mobile: m,
        source: "walkin",
        amount: amount || "40",
        payMethod,

        // Employee / gate information
        employeeId: "EMP-001",
        employeeName: "R. Menon",
        gateName: "Entry Gate",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBookingToast("SYS", data.error);
      return;
    }
    setLastBooking(data.booking);
    try {
      const url = await QRCode.toDataURL(
        JSON.stringify({ id: data.booking.id, slot: data.booking.slotLabel, vehicle: data.booking.vehicle }),
        { width: 110, margin: 1, color: { dark: "#14161a", light: "#ffffff" } }
      );
      setReceiptQr(url);
    } catch {
      setReceiptQr("");
    }
    setBookingToast("PRINT", "Ticket " + data.booking.id + " printed. Hand it to the customer.", "green");
    refreshStats();
  }

  async function openEntryFromReceipt() {
    if (!lastBooking) return;
    await fetch("/api/bookings/" + lastBooking.id + "/entry", { method: "POST" });
    triggerGate("entry", "Booking " + lastBooking.id);
    setBookingToast("GATE", "Entry barrier opened for " + lastBooking.id + ".", "green");
    refreshStats();
  }

  function startNewBooking() {
    setVehicle("");
    setMobile("");
    setAmount("40");
    setLastBooking(null);
    setBookingToast("SYS", "Enter vehicle & mobile, then print a ticket.");
  }

  async function openEntryFor(id: string) {
    await fetch("/api/bookings/" + id + "/entry", { method: "POST" });
    triggerGate("entry", "Booking " + id);
    refreshStats();
    refreshSearch(searchQuery);
  }
  async function openExitFor(id: string) {
    await fetch("/api/bookings/" + id + "/exit", { method: "POST" });
    triggerGate("exit", "Booking " + id);
    refreshStats();
    refreshSearch(searchQuery);
  }

  const panelTitles: Record<string, string> = {
    booking: "New walk-in booking",
    search: "Search booking",
    gate: "Gate control",
    occupancy: "Live occupancy",
  };

  const freeSlots = slots.filter((s) => s.status === "available").length;

  return (
    <DashboardShell
      title={panelTitles[panel]}
      subtitle="Entry Gate · Lot A, Lulu Mall, Kochi"
      connected={connected}
      navItems={navItems}
      activePanel={panel}
      onNavigate={setPanel}
      shiftLabel="R. Menon · Shift 08:00–16:00"
      footerLabel="Entry Gate dashboard · synced live with customer, security, owner & admin views"
      accentLabel={"Entry Gate · Lot A\nLulu Mall, Kochi"}
    >
      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="Walk-ins today" value={stats?.walkins ?? 0} icon={Users} tone="amber" />
        <StatCard label="Revenue collected" value={"₹" + (stats?.revenue ?? 0)} icon={IndianRupee} tone="green" />
        <StatCard label="Active sessions" value={stats?.activeSessions ?? 0} icon={ArrowLeftRight} tone="blue" />
        <StatCard label="Free slots" value={freeSlots} icon={ParkingSquare} tone="fog" />
      </div>

      {panel === "booking" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <h3 className="mb-5 text-[16px] font-semibold">Create walk-in booking</h3>
            <div className="mb-4 grid grid-cols-2 gap-3.5">
              <Field label="Vehicle number">
                <input
                  className="input"
                  placeholder="KL-00-AA-0000"
                  maxLength={15}
                  value={vehicle}
                  onChange={(e) => {
                    setVehicle(formatVehicleNumber(e.target.value));
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Field label="Mobile number">
                <input
                  className="input"
                  placeholder="98765 43210"
                  maxLength={10}
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setMobile(value);
                  }}
                />
              </Field>
            </div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">Payment method</label>
            <div className="mb-4 flex gap-2.5">
              {(["cash", "card", "upi"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={clsx(
                    "flex-1 rounded-lg border py-2.5 text-center text-[13.5px] capitalize transition-colors",
                    payMethod === m ? "border-amber bg-amber/[0.07] text-amber" : "border-line-strong text-mist"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <Field label="Amount collected (₹)">
              <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Button full onClick={printTicket}>Assign slot &amp; print ticket</Button>
            <div className="mt-4">
              <Toast tag={toast.tag} message={toast.message} tone={toast.tone} />
            </div>
          </div>

          {lastBooking && (
            <div className="rounded-2xl border border-line-strong bg-panel p-6">
              <h3 className="mb-5 text-center text-[16px] font-semibold">Thermal ticket preview</h3>
              <div className="mx-auto max-w-[280px] rounded-md bg-white px-5 py-5 font-mono text-[12.5px] text-asphalt shadow-panel">
                <div className="text-center text-[15px] font-bold tracking-wide">PARKFLOW</div>
                <div className="mb-3 text-center text-[10.5px] text-neutral-500">Lot A · Lulu Mall, Kochi</div>
                <hr className="my-2.5 border-dashed border-neutral-400" />
                <ReceiptLine label="Booking ID" value={lastBooking.id} />
                <ReceiptLine label="Vehicle" value={lastBooking.vehicle} />
                <ReceiptLine label="Slot" value={lastBooking.slotLabel} />
                <ReceiptLine label="Amount" value={`₹${lastBooking.amount} (${lastBooking.payMethod})`} />
                <ReceiptLine label="Time" value={new Date(lastBooking.createdAt).toLocaleTimeString()} />
                <div className="my-3 flex justify-center">
                  {receiptQr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={receiptQr} width={110} height={110} alt="Booking QR" />
                  )}
                </div>
                <hr className="my-2.5 border-dashed border-neutral-400" />
                <div className="text-center text-[10px] text-neutral-500">
                  Scan at entry &amp; exit · Report occupied slot via QR
                </div>
              </div>
              <div className="mt-5 flex gap-2.5">
                <Button variant="ghost" full onClick={openEntryFromReceipt}>Open entry barrier</Button>
                <Button full onClick={startNewBooking}>New booking</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {panel === "search" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Search bookings</h3>
          <div className="mb-5 flex gap-2.5">
            <input
              className="input"
              placeholder="Search by vehicle number or booking ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="ghost" onClick={() => setSearchQuery("")}>Clear</Button>
          </div>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Booking ID", "Vehicle", "Slot", "Status", "Entry", "Action"].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {searchResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mist-dim">No matching bookings.</td>
                </tr>
              )}
              {searchResults.slice().reverse().map((b) => (
                <tr key={b.id} className="border-b border-line last:border-none">
                  <td className="px-3 py-3 font-mono">{b.id}</td>
                  <td className="px-3 py-3 font-mono">{b.vehicle}</td>
                  <td className="px-3 py-3 font-mono">{b.slotLabel}</td>
                  <td className="px-3 py-3">
                    <Badge tone={b.status === "booked" ? "amber" : b.status === "active" ? "green" : "mist"}>{b.status}</Badge>
                  </td>
                  <td className="px-3 py-3 font-mono">{b.entryTime ? new Date(b.entryTime).toLocaleTimeString() : "—"}</td>
                  <td className="px-3 py-3">
                    {b.status === "booked" && (
                      <Button size="sm" variant="ghost" onClick={() => openEntryFor(b.id)}>Open entry</Button>
                    )}
                    {b.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => openExitFor(b.id)}>Open exit</Button>
                    )}
                    {b.status === "completed" && <span className="text-[12px] text-mist-dim">Done</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "gate" && (
        <div>
          <div className="mb-5 grid gap-4.5 sm:grid-cols-2">
            <GateCard title="Entry barrier" open={gate.entry}
              onOpen={() => { setGate((g) => ({ ...g, entry: true })); logGate("Entry barrier opened manually"); }}
              onClose={() => { setGate((g) => ({ ...g, entry: false })); logGate("Entry barrier closed manually"); }}
            />
            <GateCard title="Exit barrier" open={gate.exit}
              onOpen={() => { setGate((g) => ({ ...g, exit: true })); logGate("Exit barrier opened manually"); }}
              onClose={() => { setGate((g) => ({ ...g, exit: false })); logGate("Exit barrier closed manually"); }}
            />
          </div>
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <h3 className="mb-3.5 text-[15px] font-semibold">Gate activity log</h3>
            <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto">
              {gateLog.length === 0 && <div className="text-[13px] text-mist-dim">No gate activity yet.</div>}
              {gateLog.map((l, i) => (
                <div key={i} className="flex justify-between rounded-md bg-asphalt-2 px-3 py-2.5 font-mono text-[12.5px] text-mist">
                  <span>{l.msg}</span>
                  <span className="text-mist-dim">{l.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {panel === "occupancy" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-4 text-[16px] font-semibold">Lot A · Live occupancy</h3>
          <SlotGrid slots={slots} />
          <div className="mt-4">
            <SlotLegend showYours={false} />
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          background: #131519;
          border: 1px solid rgba(237, 235, 228, 0.14);
          border-radius: 8px;
          padding: 12px 13px;
          color: #f1efe9;
          font-family: var(--font-plex), monospace;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #f5b700;
        }
        .input::placeholder {
          color: #666b76;
          font-family: var(--font-inter), sans-serif;
        }
      `}</style>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">{label}</label>
      {children}
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5 flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function GateCard({
  title,
  open,
  onOpen,
  onClose,
}: {
  title: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line-strong bg-panel p-6 text-center">
      <h3 className="mb-4.5 text-[15px] font-semibold">{title}</h3>
      <div className="mb-4.5 flex h-[70px] items-center justify-center overflow-hidden rounded-lg bg-asphalt-2">
        <div
          className={clsx(
            "h-2 w-[70%] origin-left rounded-full transition-transform duration-500",
            open && "-rotate-[72deg] -translate-y-1.5"
          )}
          style={{
            background: "repeating-linear-gradient(90deg, #ff5470 0 16px, #fff 16px 32px)",
          }}
        />
      </div>
      <div className={clsx("mb-4 font-mono text-[12.5px]", open ? "text-green" : "text-mist")}>
        {open ? "Open" : "Closed"}
      </div>
      <div className="flex gap-2.5">
        <Button full onClick={onOpen}>Open</Button>
        <Button variant="ghost" full onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
