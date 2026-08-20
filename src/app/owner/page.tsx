"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, IndianRupee, Users, Cpu, History, Trash2 } from "lucide-react";
import { DashboardShell, NavItem } from "@/components/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { TrendChart } from "@/components/ui/TrendChart";
import { Toast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import type { Booking, Employee, HardwareItem, Incident, Stats } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const navItems: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "pricing", label: "Pricing", icon: IndianRupee },
  { key: "employees", label: "Employees", icon: Users },
  { key: "hardware", label: "Hardware status", icon: Cpu },
  { key: "incidents", label: "Incident history", icon: History },
];

export default function OwnerPage() {
  const [panel, setPanel] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [priceInput, setPriceInput] = useState("");
  const [priceToast, setPriceToast] = useState({ tag: "SYS", message: "Loading current rate…" });
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("Entry Employee");
  const [empShift, setEmpShift] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const loadOverview = useCallback(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
    fetch("/api/bookings").then((r) => r.json()).then(setBookings);
  }, []);

  const loadPricing = useCallback(() => {
    fetch("/api/pricing").then((r) => r.json()).then((p) => {
      setPriceInput(String(p.hourly));
      setPriceToast({ tag: "SYS", message: `Current rate: ₹${p.hourly} / hour` });
    });
  }, []);

  const loadEmployees = useCallback(() => {
    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
  }, []);

  const loadHardware = useCallback(() => {
    fetch("/api/hardware").then((r) => r.json()).then(setHardware);
  }, []);

  const loadIncidentHistory = useCallback(() => {
    fetch("/api/incidents").then((r) => r.json()).then(setIncidents);
  }, []);

  const connected = useRealtime(
    useCallback(
      (event) => {
        if (event.type === "booking:new" || event.type === "booking:update" || event.type === "incident:update") {
          loadOverview();
        }
        if (event.type === "employees:update") setEmployees(event.payload);
        if ((event.type === "incident:new" || event.type === "incident:update") && panel === "incidents") {
          loadIncidentHistory();
        }
      },
      [loadOverview, loadIncidentHistory, panel]
    )
  );

  useEffect(() => {
    loadOverview();
    loadPricing();
    loadEmployees();
    const t = setInterval(loadOverview, 5000);
    return () => clearInterval(t);
  }, [loadOverview, loadPricing, loadEmployees]);

  useEffect(() => {
    if (panel === "hardware") loadHardware();
    if (panel === "incidents") loadIncidentHistory();
    if (panel === "pricing") loadPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  async function savePrice() {
    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hourly: priceInput.trim() }),
    });
    const data = await res.json();
    if (res.ok) setPriceToast({ tag: "OK", message: `Rate updated to ₹${data.hourly} / hour` });
    else setPriceToast({ tag: "SYS", message: data.error });
  }

  async function addEmployee() {
    if (!empName.trim()) return;
    await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: empName.trim(), role: empRole, shift: empShift.trim() }),
    });
    setEmpName("");
    setEmpShift("");
    loadEmployees();
  }

  async function removeEmployee(id: string) {
    await fetch("/api/employees/" + id, { method: "DELETE" });
    loadEmployees();
  }

  const panelTitles: Record<string, string> = {
    overview: "Overview",
    pricing: "Pricing",
    employees: "Employees",
    hardware: "Hardware status",
    incidents: "Incident history",
  };

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const cash = bookings
    .filter(
      (b) =>
        b.source === "walkin" &&
        b.payMethod?.toLowerCase() === "cash"
    )
    .reduce(
      (s, b) => s + (Number(b.amount) || 0),
      0
    );

  const card = bookings
    .filter(
      (b) =>
        b.source === "walkin" &&
        b.payMethod?.toLowerCase() === "card"
    )
    .reduce(
      (s, b) => s + (Number(b.amount) || 0),
      0
    );

  const upi = bookings
    .filter(
      (b) =>
        b.source === "walkin" &&
        b.payMethod?.toLowerCase() === "upi"
    )
    .reduce(
      (s, b) => s + (Number(b.amount) || 0),
      0
    );








    
  const maxRev = Math.max(cash, card, upi, 1);
  const online = bookings.filter((b) => b.source === "online").length;
  const walkin = bookings.filter((b) => b.source === "walkin").length;
  const maxSrc = Math.max(online, walkin, 1);
  const onlineRevenue = bookings
    .filter((b) => b.source === "online")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const gateRevenue = bookings
    .filter((b) => b.source === "walkin")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const gateBookings = bookings.filter(
    (b) => b.source === "walkin"
  );

  const onlineBookings = bookings.filter(
    (b) => b.source === "online"
  );
  const employeeRevenue = gateBookings.reduce<
    Record<
      string,
      {
        employeeName: string;
        gateName: string;
        cash: number;
        card: number;
        upi: number;
        total: number;
      }
    >
  >((acc, booking) => {
    const key =
      booking.employeeId ||
      booking.employeeName ||
      "unknown";

    if (!acc[key]) {
      acc[key] = {
        employeeName:
          booking.employeeName || "Unknown employee",
        gateName:
          booking.gateName || "Entry Gate",
        cash: 0,
        card: 0,
        upi: 0,
        total: 0,
      };
    }

    const amount = Number(booking.amount) || 0;
    const method = booking.payMethod?.toLowerCase();

    acc[key].total += amount;

    if (method === "cash") {
      acc[key].cash += amount;
    }

    if (method === "card") {
      acc[key].card += amount;
    }

    if (method === "upi") {
      acc[key].upi += amount;
    }

    return acc;
  }, {});
  const employeeRevenueList = Object.values(employeeRevenue);

  // Real hourly revenue trend, bucketed from each booking's actual createdAt —
  // no synthetic data. Shows the last 12 hours up to and including the
  // current hour so the chart always ends "now".
  const currentHour = new Date().getHours();
  const hourlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const hour = (currentHour - 11 + i + 24) % 24;
    const total = bookings
      .filter((b) => new Date(b.createdAt).getHours() === hour)
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    return { label: String(hour).padStart(2, "0") + "h", value: total };
  });

  return (
    <DashboardShell
      title={panelTitles[panel]}
      subtitle="Parking Owner · Lulu Mall, Kochi"
      connected={connected}
      navItems={navItems}
      activePanel={panel}
      onNavigate={setPanel}
      shiftLabel="Lot A · Live"
      footerLabel="Owner dashboard · synced live with customer, gate, security & admin views"
      accentLabel={"Parking Owner\nLulu Mall, Kochi"}
    >
      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="Revenue today" value={"₹" + totalRevenue} icon={IndianRupee} tone="green" />
        <StatCard label="Bookings today" value={bookings.length} icon={LayoutGrid} tone="amber" />
        <StatCard label="Active sessions" value={stats?.activeSessions ?? 0} icon={Users} tone="blue" />
        <StatCard label="Lot occupancy" value={(stats?.occupancyPct ?? 0) + "%"} tone="fog" />
      </div>

      {panel === "overview" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">Revenue by hour</h3>
              <span className="font-mono text-[11px] text-mist-dim">last 12 hours · today</span>
            </div>
            <TrendChart data={hourlyRevenue} toneClass="text-green" valuePrefix="₹" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            {/* REVENUE SOURCE */}
            <div className="rounded-2xl border border-line-strong bg-panel p-6">
              <h3 className="mb-4 text-[15px] font-semibold">
                Revenue by source
              </h3>

              <BarRow
                label="Online"
                value={"₹" + onlineRevenue}
                pct={Math.round(
                  (onlineRevenue / Math.max(totalRevenue, 1)) * 100
                )}
                tone="blue"
              />

              <BarRow
                label="Entry Gate"
                value={"₹" + gateRevenue}
                pct={Math.round(
                  (gateRevenue / Math.max(totalRevenue, 1)) * 100
                )}
                tone="green"
              />

              <div className="mt-5 border-t border-line-strong pt-4">
                <div className="flex justify-between">
                  <span className="text-mist">
                    Total Revenue
                  </span>

                  <span className="font-heading text-xl font-bold">
                    ₹{totalRevenue}
                  </span>
                </div>
              </div>
            </div>


            {/* PAYMENT METHODS */}
            <div className="rounded-2xl border border-line-strong bg-panel p-6">
              <h3 className="mb-4 text-[15px] font-semibold">
                Revenue by payment method
              </h3>

              <BarRow
                label="Cash"
                value={"₹" + cash}
                pct={Math.round(
                  (cash / Math.max(totalRevenue, 1)) * 100
                )}
                tone="green"
              />

              <BarRow
                label="Card"
                value={"₹" + card}
                pct={Math.round(
                  (card / Math.max(totalRevenue, 1)) * 100
                )}
                tone="green"
              />

              <BarRow
                label="UPI"
                value={"₹" + upi}
                pct={Math.round(
                  (upi / Math.max(totalRevenue, 1)) * 100
                )}
                tone="green"
              />

              <div className="mt-5 border-t border-line-strong pt-4">
                <div className="text-[12px] uppercase tracking-wide text-mist-dim">
                  All payment methods
                </div>

                <div className="mt-1 font-heading text-xl font-bold">
                  ₹{cash + card + upi}
                </div>
              </div>
            </div>

          </div>
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold">
                  Gate revenue & collections
                </h3>

                <p className="mt-1 text-[12px] text-mist-dim">
                  Revenue collected at the parking entrance
                </p>
              </div>

              <div className="font-heading text-xl font-bold">
                ₹{gateRevenue}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {[
                      "Gate",
                      "Employee",
                      "Cash",
                      "Card",
                      "UPI",
                      "Total",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-line-strong px-3 py-3 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {employeeRevenueList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-mist-dim"
                      >
                        No gate collections yet.
                      </td>
                    </tr>
                  ) : (
                    employeeRevenueList.map((employee) => (
                      <tr
                        key={`${employee.gateName}-${employee.employeeName}`}
                        className="border-b border-line last:border-none"
                      >
                        <td className="px-3 py-3">
                          {employee.gateName}
                        </td>

                        <td className="px-3 py-3 font-medium">
                          {employee.employeeName}
                        </td>

                        <td className="px-3 py-3 font-mono">
                          ₹{employee.cash}
                        </td>

                        <td className="px-3 py-3 font-mono">
                          ₹{employee.card}
                        </td>

                        <td className="px-3 py-3 font-mono">
                          ₹{employee.upi}
                        </td>

                        <td className="px-3 py-3 font-mono font-semibold">
                          ₹{employee.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <h3 className="mb-5 text-[15px] font-semibold">Operational health</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="font-heading text-[24px] font-bold">{stats?.resolved ?? 0}</div>
                <div className="mt-1 text-[12px] uppercase tracking-wide text-mist-dim">Incidents resolved today</div>
              </div>
              <div>
                <div className="font-heading text-[24px] font-bold">{stats?.reassigned ?? 0}</div>
                <div className="mt-1 text-[12px] uppercase tracking-wide text-mist-dim">Auto-reassigned today</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {panel === "pricing" && (
        <div className="max-w-[420px] rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Hourly parking rate</h3>
          <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">Rate per hour (₹)</label>
          <input className="input mb-4" inputMode="numeric" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
          <Button full onClick={savePrice}>Save rate</Button>
          <div className="mt-4">
            <Toast tag={priceToast.tag} message={priceToast.message} />
          </div>
        </div>
      )}

      {panel === "employees" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <h3 className="mb-5 text-[16px] font-semibold">Add employee</h3>
            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">Name</label>
              <input className="input" placeholder="e.g. K. Varma" value={empName} onChange={(e) => setEmpName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">Role</label>
              <select className="input" value={empRole} onChange={(e) => setEmpRole(e.target.value)}>
                <option>Entry Employee</option>
                <option>Security</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="mb-1.5 block text-[12px] uppercase tracking-wide text-mist">Shift</label>
              <input className="input" placeholder="e.g. 08:00–16:00" value={empShift} onChange={(e) => setEmpShift(e.target.value)} />
            </div>
            <Button full onClick={addEmployee}>Add employee</Button>
          </div>
          <div className="rounded-2xl border border-line-strong bg-panel p-6">
            <h3 className="mb-5 text-[16px] font-semibold">Team</h3>
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {["Name", "Role", "Shift", ""].map((h) => (
                    <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-mist-dim">No employees added yet.</td>
                  </tr>
                )}
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-none">
                    <td className="px-3 py-3">{e.name}</td>
                    <td className="px-3 py-3">{e.role}</td>
                    <td className="px-3 py-3 font-mono">{e.shift}</td>
                    <td className="px-3 py-3">
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => removeEmployee(e.id)}>
                        <Trash2 size={12} /> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {panel === "hardware" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Hardware status</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hardware.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-line-strong bg-asphalt-2 px-4 py-3.5">
                <span className="text-[13.5px]">{h.name}</span>
                <Badge tone={h.status === "online" ? "green" : "red"}>{h.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === "incidents" && (
        <div className="rounded-2xl border border-line-strong bg-panel p-6">
          <h3 className="mb-5 text-[16px] font-semibold">Incident history</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Incident ID", "Slot", "Expected customer", "Priority", "Outcome"].map((h) => (
                  <th key={h} className="border-b border-line-strong px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-mist-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mist-dim">No incidents yet.</td>
                </tr>
              )}
              {incidents.slice().reverse().map((i) => {
                const outcome =
                  i.status === "active" ? "In progress" : i.status === "resolved" ? "Resolved · slot cleared" : "Reassigned to " + (i.fallbackSlot || "—");
                return (
                  <tr key={i.id} className="border-b border-line last:border-none">
                    <td className="px-3 py-3 font-mono">{i.id}</td>
                    <td className="px-3 py-3 font-mono">{i.slotLabel}</td>
                    <td className="px-3 py-3 font-mono">{i.expectedCustomer}</td>
                    <td className="px-3 py-3">
                      <Badge tone={i.priority === "high" ? "red" : "amber"}>{i.priority}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={i.status === "active" ? "amber" : i.status === "resolved" ? "green" : "blue"}>{outcome}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

function BarRow({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: "green" | "blue" }) {
  return (
    <div className="mb-3.5 flex items-center gap-3 last:mb-0">
      <div className="w-16 text-[12.5px] text-mist">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-asphalt-2">
        <div
          className={clsx("h-full rounded-full transition-all", tone === "green" ? "bg-green" : "bg-blue")}
          style={{ width: pct + "%" }}
        />
      </div>
      <div className="w-14 text-right font-mono text-[12.5px]">{value}</div>
    </div>
  );
}
