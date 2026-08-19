"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Search, History, Map, Phone } from "lucide-react";
import { DashboardShell, NavItem } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { SlotGrid, SlotLegend } from "@/components/ui/SlotGrid";
import { useRealtime } from "@/hooks/useRealtime";
import type { Booking, Incident, Slot, Stats } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const navItems: NavItem[] = [
  { key: "incidents", label: "Live incidents", icon: ShieldAlert },
  { key: "lookup", label: "Vehicle lookup", icon: Search },
  { key: "history", label: "Incident history", icon: History },
  { key: "map", label: "Lot map", icon: Map },
];

interface HistoryRow {
  id: string;
  slotLabel: string;
  expectedCustomer: string;
  outcome: string;
  resolvedTone: "green" | "amber";
  resolvedAt: string;
}

export default function SecurityPage() {
  const [panel, setPanel] = useState("incidents");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<Booking[]>([]);

  const refreshStats = useCallback(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const loadIncidents = useCallback(() => {
    fetch("/api/incidents?activeOnly=true").then((r) => r.json()).then(setIncidents);
  }, []);

  const refreshLookup = useCallback((q: string) => {
    fetch("/api/bookings" + (q ? "?q=" + encodeURIComponent(q) + "&activeOnly=true" : "?activeOnly=true"))
      .then((r) => r.json())
      .then(setLookupResults);
  }, []);

  function pushHistoryRow(inc: Incident) {
    if (inc.status !== "resolved" && inc.status !== "reassigned") return;
    const outcome =
      inc.status === "resolved"
        ? "Resolved · slot cleared"
        : "Not responding · reassigned to " + (inc.fallbackSlot || "no free slot");
    setHistory((prev) => [
      {
        id: inc.id,
        slotLabel: inc.slotLabel,
        expectedCustomer: inc.expectedCustomer,
        outcome,
        resolvedTone: inc.status === "resolved" ? "green" : "amber",
        resolvedAt: inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleTimeString() : "—",
      },
      ...prev,
    ]);
  }

  const connected = useRealtime(
    useCallback(
      (event) => {
        if (event.type === "slots:update") setSlots(event.payload);
        if (event.type === "incident:new") {
          setIncidents((prev) => [...prev, event.payload]);
          refreshStats();
        }
        if (event.type === "incident:update") {
          const inc = event.payload;
          setIncidents((prev) => {
            const filtered = prev.filter((i) => i.id !== inc.id || inc.status === "active");
            if (inc.status === "active") {
              const idx = filtered.findIndex((i) => i.id === inc.id);
              if (idx >= 0) filtered[idx] = inc;
            }
            return filtered;
          });
          refreshStats();
          pushHistoryRow(inc);
        }
      },
      [refreshStats]
    )
  );

  useEffect(() => {
    fetch("/api/slots").then((r) => r.json()).then(setSlots);
    refreshStats();
    loadIncidents();
    const t = setInterval(refreshStats, 4000);
    return () => clearInterval(t);
  }, [refreshStats, loadIncidents]);

  useEffect(() => {
    if (panel === "lookup") refreshLookup(lookupQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  useEffect(() => {
    if (panel === "lookup") {
      const t = setTimeout(() => refreshLookup(lookupQuery), 200);
      return () => clearTimeout(t);
    }
  }, [lookupQuery, panel, refreshLookup]);

  function contactDriver(id: string) {
    setIncidentLogs((prev) => ({ ...prev, [id]: "Calling wrong vehicle driver…" }));
    setTimeout(() => {
      const answered = Math.random() < 0.6;
      setIncidentLogs((prev) => ({
        ...prev,
        [id]: answered ? "Driver answered — asked to move the vehicle." : "No answer. Approaching vehicle on foot.",
      }));
    }, 1400);
  }

  async function resolve(id: string) {
    await fetch("/api/incidents/" + id + "/resolve", { method: "POST" });
  }
  async function notResponding(id: string) {
    await fetch("/api/incidents/" + id + "/not-responding", { method: "POST" });
  }

  const panelTitles: Record<string, string> = {
    incidents: "Live incidents",
    lookup: "Vehicle lookup",
    history: "Incident history",
    map: "Lot map",
  };

  const activeIncidents = incidents.filter((i) => i.status === "active");

  return (
    <DashboardShell
      title={panelTitles[panel]}
      subtitle="Security Desk · Lot A, Lulu Mall, Kochi"
      connected={connected}
      navItems={navItems}
      activePanel={panel}
      onNavigate={setPanel}
      shiftLabel="S. Naik · On duty"
      footerLabel="Security dashboard · synced live with customer, gate, owner & admin views"
      accentLabel={"Security Desk · Lot A\nLulu Mall, Kochi"}
    >
      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="Active incidents" value={stats?.activeIncidents ?? 0} icon={ShieldAlert} tone="red" />
        <StatCard label="Resolved today" value={stats?.resolved ?? 0} icon={History} tone="green" />
        <StatCard label="Auto-reassigned" value={stats?.reassigned ?? 0} icon={Map} tone="amber" />
        <StatCard label="Lot occupancy" value={(stats?.occupancyPct ?? 0) + "%"} tone="blue" />
      </div>

      {panel === "incidents" && (
        <div className="flex flex-col gap-4">
          {activeIncidents.length === 0 && (
            <div className="rounded-2xl border border-line-strong bg-panel px-8 py-16 text-center text-mist">
              <div className="mb-2 font-heading text-[17px] font-semibold text-fog">No active incidents</div>
              Reserved slots are matching sensor data. New incidents appear here automatically.
            </div>
          )}
          {activeIncidents.map((inc) => (
            <div
              key={inc.id}
              className={clsx(
                "rounded-2xl border bg-panel p-6",
                inc.priority === "high" ? "border-red/40" : "border-line-strong"
              )}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[13px] text-mist">Incident #{inc.id}</span>
                <Badge tone={inc.priority === "high" ? "red" : "amber"}>{inc.priority} priority</Badge>
              </div>
              <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <IField label="Slot" value={inc.slotLabel} />
                <IField label="Expected customer" value={inc.expectedCustomer} />
                <IField label="Wrong vehicle" value={inc.wrongVehicle} />
                <IField label="Reported" value={new Date(inc.createdAt).toLocaleTimeString()} />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="ghost" size="sm" onClick={() => contactDriver(inc.id)}>Contact driver</Button>
                <Button size="sm" variant="success" onClick={() => resolve(inc.id)}>
                  Confirm resolved
                </Button>
                <Button variant="danger" size="sm" onClick={() => notResponding(inc.id)}>Mark not responding</Button>
              </div>
              {incidentLogs[inc.id] && (
                <div className="mt-4 rounded-lg border border-line-strong bg-asphalt-2 px-3.5 py-2.5 font-mono text-[12.5px] text-mist">
                  {incidentLogs[inc.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {panel === "lookup" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Search vehicle</h3>
          <div className="mb-5 flex gap-2.5">
            <input
              className="input"
              placeholder="Search by vehicle number…"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
            />
            <Button variant="ghost" onClick={() => setLookupQuery("")}>Clear</Button>
          </div>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Vehicle", "Slot", "Status", "Entry time", "Action"].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lookupResults.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mist-dim">No matching vehicle.</td>
                </tr>
              )}
              {lookupResults.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-none">
                  <td className="px-3 py-3 font-mono">{b.vehicle}</td>
                  <td className="px-3 py-3 font-mono">{b.slotLabel}</td>
                  <td className="px-3 py-3">
                    <Badge tone={b.status === "active" ? "green" : "amber"}>{b.status}</Badge>
                  </td>
                  <td className="px-3 py-3 font-mono">{b.entryTime ? new Date(b.entryTime).toLocaleTimeString() : "—"}</td>
                  <td className="px-3 py-3">
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => alert("Calling driver of " + b.vehicle + "… (demo)")}>
                      <Phone size={12} /> Call driver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "history" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Incident history</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Incident ID", "Slot", "Expected customer", "Outcome", "Resolved at"].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mist-dim">No incidents resolved yet.</td>
                </tr>
              )}
              {history.map((h, i) => (
                <tr key={i} className="border-b border-line last:border-none">
                  <td className="px-3 py-3 font-mono">{h.id}</td>
                  <td className="px-3 py-3 font-mono">{h.slotLabel}</td>
                  <td className="px-3 py-3 font-mono">{h.expectedCustomer}</td>
                  <td className="px-3 py-3">
                    <Badge tone={h.resolvedTone}>{h.outcome}</Badge>
                  </td>
                  <td className="px-3 py-3 font-mono">{h.resolvedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "map" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-4 text-[16px] font-semibold">Lot A · Live map</h3>
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

function IField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-mist-dim">{label}</div>
      <div className="font-mono text-[14px]">{value}</div>
    </div>
  );
}
