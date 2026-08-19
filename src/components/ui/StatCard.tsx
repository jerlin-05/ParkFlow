import { LucideIcon } from "lucide-react";
import { clsx } from "@/lib/clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "amber" | "green" | "red" | "blue" | "fog";
  hint?: string;
}

const toneText: Record<string, string> = {
  amber: "text-amber",
  green: "text-green",
  red: "text-red",
  blue: "text-blue",
  fog: "text-fog",
};

const toneGlow: Record<string, string> = {
  amber: "bg-amber/10 text-amber",
  green: "bg-green/10 text-green",
  red: "bg-red/10 text-red",
  blue: "bg-blue/10 text-blue",
  fog: "bg-white/5 text-mist",
};

export function StatCard({ label, value, icon: Icon, tone = "fog", hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel/80 p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between">
        <div>
          <div className={clsx("font-heading text-[26px] font-bold leading-none", toneText[tone])}>{value}</div>
          <div className="mt-2 text-[11.5px] uppercase tracking-wide text-mist-dim">{label}</div>
        </div>
        {Icon && (
          <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", toneGlow[tone])}>
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>
      {hint && <div className="mt-3 text-[11.5px] text-mist-dim">{hint}</div>}
    </div>
  );
}
