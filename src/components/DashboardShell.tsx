"use client";

import Link from "next/link";
import { clsx } from "@/lib/clsx";
import { ConnStatus } from "@/components/ui/ConnStatus";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  title: string;
  subtitle: string;
  connected: boolean;
  navItems: NavItem[];
  activePanel: string;
  onNavigate: (key: string) => void;
  shiftLabel: string;
  children: React.ReactNode;
  footerLabel: string;
  accentLabel: string;
}

export function DashboardShell({
  title,
  subtitle,
  connected,
  navItems,
  activePanel,
  onNavigate,
  shiftLabel,
  children,
  footerLabel,
  accentLabel,
}: DashboardShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-20 flex h-fit flex-col gap-1 border-b border-line bg-asphalt-2 p-4 md:h-screen md:border-b-0 md:border-r">
        <Link href="/" className="mb-1 flex items-center gap-2 px-2 pb-4 pt-1.5">
          <span className="font-display text-[19px] font-black">ParkFlow</span>
          <span className="flex gap-[3px]">
            <span className="h-1.5 w-1.5 bg-green" />
            <span className="h-1.5 w-1.5 bg-amber" />
            <span className="h-1.5 w-1.5 bg-red" />
          </span>
        </Link>
        <div className="px-2 pb-4">
          <ConnStatus connected={connected} />
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePanel === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] transition-all duration-150",
                  active
                    ? "bg-amber/[0.1] text-fog"
                    : "text-mist hover:bg-panel/70 hover:text-fog"
                )}
              >
                <span
                  className={clsx(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors",
                    active ? "bg-amber/15" : "bg-transparent"
                  )}
                >
                  <Icon size={15} strokeWidth={2} className={active ? "text-amber" : "text-mist-dim"} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line px-2 pt-4 text-[12px] leading-relaxed text-mist-dim">
          {accentLabel}
        </div>
      </aside>

      <main className="p-6 pb-16 md:p-9">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3.5">
          <div>
            <h1 className="font-heading text-[22px] font-bold">{title}</h1>
            <p className="mt-0.5 text-[13px] text-mist">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-panel px-3.5 py-2 font-mono text-[12.5px] text-mist">
            <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-green" />
            {shiftLabel}
          </div>
        </div>
        {children}
        <div className="mt-10 text-[11.5px] text-mist-dim">{footerLabel}</div>
      </main>
    </div>
  );
}
