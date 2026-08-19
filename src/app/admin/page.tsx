"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Activity, LifeBuoy } from "lucide-react";
import { DashboardShell, NavItem } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { useRealtime } from "@/hooks/useRealtime";
import type { Operator, PlatformStats } from "@/lib/types";

const navItems: NavItem[] = [
  { key: "operators", label: "Operators", icon: Building2 },
  { key: "platform", label: "Platform monitoring", icon: Activity },
  { key: "support", label: "Support", icon: LifeBuoy },
];

function fmtUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function AdminPage() {
  const [panel, setPanel] = useState("operators");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [platform, setPlatform] = useState<PlatformStats | null>(null);

  const loadOperators = useCallback(() => {
    fetch("/api/operators").then((r) => r.json()).then(setOperators);
  }, []);

  const loadPlatform = useCallback(() => {
    fetch("/api/platform").then((r) => r.json()).then(setPlatform);
  }, []);

  const connected = useRealtime(
    useCallback(
      (event) => {
        if (event.type === "operators:update") loadOperators();
      },
      [loadOperators]
    )
  );

  useEffect(() => {
    loadOperators();
    loadPlatform();
    const t = setInterval(loadPlatform, 4000);
    return () => clearInterval(t);
  }, [loadOperators, loadPlatform]);

  async function toggleOperator(id: string) {
    await fetch("/api/operators/" + id + "/toggle", { method: "POST" });
    loadOperators();
  }

  const panelTitles: Record<string, string> = {
    operators: "Operators",
    platform: "Platform monitoring",
    support: "Support",
  };

  return (
    <DashboardShell
      title={panelTitles[panel]}
      subtitle="ParkFlow Super Admin · Platform-wide view"
      connected={connected}
      navItems={navItems}
      activePanel={panel}
      onNavigate={setPanel}
      shiftLabel="Platform online"
      footerLabel="Super Admin dashboard · one live tenant, three simulated for illustration"
      accentLabel={"ParkFlow Super Admin\nPlatform-wide view"}
    >
      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="Total operators" value={operators.length} icon={Building2} tone="blue" />
        <StatCard label="Connected dashboards" value={platform?.connectedDashboards ?? 0} icon={Activity} tone="blue" />
        <StatCard label="Backend uptime" value={platform ? fmtUptime(platform.uptimeSeconds) : "—"} tone="fog" />
        <StatCard label="Live sessions (Lot A)" value={platform?.activeSessionsTotal ?? 0} icon={LifeBuoy} tone="green" />
      </div>

      {panel === "operators" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-1.5 text-[16px] font-semibold">Parking operators</h3>
          <p className="mb-5 text-[13px] text-mist">
            Only <strong className="text-fog">Lulu Mall Lot A</strong> is backed by this server&apos;s live data — the rest illustrate what a multi-tenant platform view looks like.
          </p>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Operator", "Plan", "Status", "Revenue today", "Occupancy", ""].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => {
                const revenue = op.live ? "₹" + op.liveRevenue : "₹" + (op.mockRevenue || 0);
                const occ = op.live ? op.liveOccupancyPct + "%" : (op.mockOccupancy || 0) + "%";
                return (
                  <tr key={op.id} className="border-b border-line last:border-none">
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        {op.name}
                        {op.live && <Badge tone="blue">live</Badge>}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="amber">{op.plan}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={op.status === "active" ? "green" : "red"}>{op.status}</Badge>
                    </td>
                    <td className="px-3 py-3 font-mono">{revenue}</td>
                    <td className="px-3 py-3 font-mono">{occ}</td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="ghost" onClick={() => toggleOperator(op.id)}>
                        {op.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {panel === "platform" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Platform monitoring</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Metric", "Value"].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Connected dashboards", platform?.connectedDashboards ?? 0],
                ["Backend uptime", platform ? fmtUptime(platform.uptimeSeconds) : "—"],
                ["Active incidents (Lot A)", platform?.activeIncidentsTotal ?? 0],
                ["Active sessions (Lot A)", platform?.activeSessionsTotal ?? 0],
                ["Total bookings today (Lot A)", platform?.totalBookingsToday ?? 0],
              ].map(([label, value]) => (
                <tr key={label as string} className="border-b border-line last:border-none">
                  <td className="px-3 py-3">{label}</td>
                  <td className="px-3 py-3 font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel === "support" && (
        <div className="flex flex-col gap-3.5 rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-1 text-[16px] font-semibold">Support</h3>
          <SupportRow label="Open tickets" value="2" />
          <SupportRow label="Avg. first response" value="14 min" />
          <SupportRow label="Escalations this week" value="0" />
          <SupportRow label="Status page" value="All systems operational" valueClassName="text-green" />
        </div>
      )}
    </DashboardShell>
  );
}

function SupportRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line-strong bg-asphalt-2 px-4 py-3.5 text-[13.5px]">
      <span>{label}</span>
      <span className={"font-mono " + (valueClassName || "")}>{value}</span>
    </div>
  );
}
