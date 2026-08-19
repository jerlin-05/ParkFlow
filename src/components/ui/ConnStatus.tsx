import { clsx } from "@/lib/clsx";

export function ConnStatus({ connected }: { connected: boolean }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 font-mono text-[11px]",
        connected ? "text-green" : "text-mist"
      )}
    >
      <span
        className={clsx(
          "h-[7px] w-[7px] rounded-full",
          connected ? "bg-green animate-pulse2" : "bg-mist-dim"
        )}
      />
      {connected ? "Live" : "Connecting…"}
    </div>
  );
}
