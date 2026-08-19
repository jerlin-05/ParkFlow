"use client";

import { clsx } from "@/lib/clsx";
import type { Slot } from "@/lib/types";

interface SlotGridProps {
  slots: Slot[];
  yourSlotIndex?: number | null;
  compact?: boolean;
}

export function SlotGrid({ slots, yourSlotIndex, compact }: SlotGridProps) {
  return (
    <div className={clsx("grid grid-cols-8 gap-[7px]", compact && "gap-1.5")}>
      {slots.map((s) => {
        const isYours = yourSlotIndex != null && s.index === yourSlotIndex;
        return (
          <div
            key={s.index}
            title={`${s.label} · ${isYours ? "your slot" : s.status}`}
            className={clsx(
              "aspect-square rounded transition-colors duration-300",
              isYours && "bg-blue shadow-[0_0_0_2px_#4fb6ff]",
              !isYours && s.status === "available" && "bg-green/85",
              !isYours && s.status === "occupied" && "bg-mist-dim/90",
              !isYours && s.status === "booked" && "bg-green/85 shadow-[inset_0_0_0_2px_#f5b700]",
              !isYours && s.status === "incident" && "bg-red animate-incidentPulse"
            )}
          />
        );
      })}
    </div>
  );
}

export function SlotLegend({ showYours = true }: { showYours?: boolean }) {
  const items: { swatch: string; label: string }[] = [
    { swatch: "bg-green/85", label: "Available" },
    { swatch: "bg-mist-dim/90", label: "Occupied" },
    ...(showYours ? [{ swatch: "bg-blue", label: "Your slot" }] : []),
    { swatch: "bg-red", label: "Incident" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-mist">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <i className={clsx("inline-block h-[9px] w-[9px] rounded-sm", it.swatch)} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
