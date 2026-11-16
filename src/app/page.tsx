import Link from "next/link";
import {
  Car,
  DoorOpen,
  ShieldAlert,
  LineChart,
  Building2,
  ArrowRight,
  Radio,
  Smartphone,
  MapPin,
  QrCode,
  KeyRound,
} from "lucide-react";
import { CustomerArt, EmployeeArt, SecurityArt, OwnerArt, AdminArt } from "@/components/ui/RoleArt";
import { LiveLotPreview } from "@/components/LiveLotPreview";

const roles = [
  {
    href: "/customer",
    icon: Car,
    art: CustomerArt,
    tone: "text-green",
    bg: "bg-green/10",
    title: "Customer",
    desc: "Book a slot, verify by OTP, and get a QR ticket for entry and exit.",
  },
  {
    href: "/employee",
    icon: DoorOpen,
    art: EmployeeArt,
    tone: "text-amber",
    bg: "bg-amber/10",
    title: "Entry Employee",
    desc: "Walk-in bookings, ticket printing, gate control, and booking search.",
  },
  {
    href: "/security",
    icon: ShieldAlert,
    art: SecurityArt,
    tone: "text-red",
    bg: "bg-red/10",
    title: "Security",
    desc: "Live incident queue, resolve or reassign conflicts, vehicle lookup.",
  },
  {
    href: "/owner",
    icon: LineChart,
    art: OwnerArt,
    tone: "text-blue",
    bg: "bg-blue/10",
    title: "Parking Owner",
    desc: "Revenue, pricing, staff roster, hardware health, incident history.",
  },
  {
    href: "/admin",
    icon: Building2,
    art: AdminArt,
    tone: "text-violet",
    bg: "bg-violet/10",
    title: "ParkFlow Admin",
    desc: "Operators, subscriptions, and platform-wide monitoring.",
  },
];

const flow = [
  { icon: Smartphone, tone: "text-green", bg: "bg-green/10", title: "Book online", desc: "Vehicle + mobile number, no account needed." },
  { icon: MapPin, tone: "text-amber", bg: "bg-amber/10", title: "Verify & arrive", desc: "OTP check, geofence confirms you're on-site." },
  { icon: QrCode, tone: "text-blue", bg: "bg-blue/10", title: "Scan to enter", desc: "QR ticket opens the barrier automatically." },
  { icon: KeyRound, tone: "text-violet", bg: "bg-violet/10", title: "Scan to exit", desc: "One more scan closes out the session." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-line bg-asphalt/80 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-[20px] font-black">ParkFlow</span>
            <span className="flex gap-[3px]">
              <span className="h-1.5 w-1.5 bg-green" />
              <span className="h-1.5 w-1.5 bg-amber" />
              <span className="h-1.5 w-1.5 bg-red" />
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11.5px] text-mist">
            <Radio size={13} className="text-green" />
            Shared live backend · updates in real time
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-line px-6 pb-16 pt-24 md:pt-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1649307035604-ab3c5e5c9e7a?fm=jpg&q=70&w=2200&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(12,13,16,0.55) 0%, rgba(12,13,16,0.88) 60%, rgba(12,13,16,1) 100%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-amber">
              <span className="h-[7px] w-[7px] rounded-full bg-amber shadow-glow" />
              Live demo · Lulu Mall Lot A, Kochi
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(34px,5vw,58px)] font-black leading-[1.05]">
              The <em className="text-green not-italic">parking operating system</em> for every
              role on the lot.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mist">
              One shared backend, five real-time dashboards. Book a slot as a customer, run the gate
              as an employee, resolve conflicts as security, manage pricing as the owner, or oversee
              the whole platform as ParkFlow admin — every action shows up instantly, everywhere.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/customer"
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-3 text-[14px] font-semibold text-asphalt transition-transform hover:-translate-y-0.5"
              >
                Book a slot now
                <ArrowRight size={15} />
              </Link>
              <a
                href="#dashboards"
                className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-5 py-3 text-[14px] font-medium text-fog transition-colors hover:border-mist"
              >
                See all dashboards
              </a>
            </div>
          </div>
          <LiveLotPreview />
        </div>
      </header>

      <section className="border-b border-line px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 font-heading text-[13px] font-semibold uppercase tracking-wide text-mist">
            How a booking flows through the lot
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="relative">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                    <Icon size={19} className={f.tone} strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 font-heading text-[15px] font-semibold">
                    <span className="mr-1.5 text-mist-dim">{i + 1}.</span>
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="dashboards" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-[13px] font-semibold uppercase tracking-wide text-mist">
              Choose a dashboard
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const Art = r.art;
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group relative overflow-hidden rounded-2xl border border-line-strong bg-panel/80 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-mist hover:shadow-panel"
                >
                  <div className={`absolute right-0 top-0 h-24 w-32 ${r.tone} opacity-[0.14]`}>
                    <Art className="h-full w-full" />
                  </div>
                  <div className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${r.bg}`}>
                    <Icon size={20} className={r.tone} strokeWidth={2} />
                  </div>
                  <h3 className="relative mt-5 font-heading text-[17px] font-semibold">{r.title}</h3>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-mist">{r.desc}</p>
                  <div className="relative mt-5 flex items-center gap-1.5 text-[12.5px] font-medium text-mist-dim transition-colors group-hover:text-fog">
                    Open dashboard
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-9">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[13px] text-mist-dim">
          <span>ParkFlow — Smart Parking Operating System</span>
        </div>
      </footer>
    </div>
  );
}
