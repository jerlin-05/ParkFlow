import { clsx } from "@/lib/clsx";

export function Toast({ tag, message, tone = "amber" }: { tag: string; message: string; tone?: "amber" | "red" | "green" }) {
  const toneColor = tone === "red" ? "text-red" : tone === "green" ? "text-green" : "text-amber";
  return (
    <div className="flex min-h-[42px] items-center rounded-lg border border-line-strong bg-asphalt-2 px-3.5 py-2.5 font-mono text-[12px] text-fog">
      <span className={clsx("mr-2 font-semibold", toneColor)}>{tag}</span>
      {message}
    </div>
  );
}
