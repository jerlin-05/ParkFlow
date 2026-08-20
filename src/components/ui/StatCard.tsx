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

const toneAccent: Record<string, string> = {
  amber: "bg-amber",
  green: "bg-green",
  red: "bg-red",
  blue: "bg-blue",
  fog: "bg-mist-dim",
};

export function StatCard({ label, value, icon: Icon, tone = "fog", hint }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-panel/80 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-panel">
      <span className={clsx("absolute inset-x-0 top-0 h-[2.5px] opacity-70", toneAccent[tone])} />
      <div className="flex items-start justify-between">
        <div>
          <div className={clsx("font-heading text-[27px] font-bold leading-none tabular-nums", toneText[tone])}>{value}</div>
          <div className="mt-2.5 text-[11.5px] uppercase tracking-wide text-mist-dim">{label}</div>
        </div>
        {Icon && (
          <div className={clsx("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", toneGlow[tone])}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      {hint && <div className="mt-3.5 border-t border-line pt-3 text-[11.5px] text-mist-dim">{hint}</div>}
    </div>
  );
}
