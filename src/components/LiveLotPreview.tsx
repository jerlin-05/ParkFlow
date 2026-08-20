"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { SlotGrid, SlotLegend } from "@/components/ui/SlotGrid";
import { useRealtime } from "@/hooks/useRealtime";
import type { Slot } from "@/lib/types";

// Live preview panel for the landing page hero: pulls the same /api/slots
// data and realtime stream that every dashboard uses, so a first-time
// visitor sees the platform actually working before picking a role.
export function LiveLotPreview() {
  const [slots, setSlots] = useState<Slot[]>([]);

  const connected = useRealtime(
    useCallback((event) => {
      if (event.type === "slots:update") setSlots(event.payload);
    }, [])
  );

  useEffect(() => {
    fetch("/api/slots")
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => {});
  }, []);

  const occupied = slots.filter((s) => s.status !== "available").length;
  const occupancyPct = slots.length ? Math.round((occupied / slots.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-line-strong bg-panel/90 p-5 shadow-panel backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wide text-mist">Lot A · live right now</div>
          <div className="mt-1 font-heading text-[22px] font-bold">
            {occupancyPct}<span className="text-mist-dim">% occupied</span>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 font-mono text-[11px] ${connected ? "text-green" : "text-mist-dim"}`}>
          <Radio size={11} />
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>
      {slots.length > 0 ? (
        <>
          <SlotGrid slots={slots} compact />
          <div className="mt-3.5">
            <SlotLegend showYours={false} />
          </div>
        </>
      ) : (
        <div className="flex h-24 items-center justify-center text-[12.5px] text-mist-dim">
          Connecting to the shared backend…
        </div>
      )}
    </div>
  );
}
