import { clsx } from "@/lib/clsx";

type Tone = "amber" | "green" | "red" | "mist" | "blue" | "violet";

const toneClasses: Record<Tone, string> = {
  amber: "bg-amber/12 text-amber",
  green: "bg-green/12 text-green",
  red: "bg-red/12 text-red",
  mist: "bg-mist/12 text-mist",
  blue: "bg-blue/12 text-blue",
  violet: "bg-violet/12 text-violet",
};

export function Badge({ tone = "mist", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
