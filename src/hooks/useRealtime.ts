"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeEvent } from "@/lib/types";

type Handler = (event: RealtimeEvent) => void;

/**
 * Opens a single EventSource connection to /api/stream and fans events out
 * to whatever handler is passed in. Automatically reconnects on drop.
 * Returns whether the stream is currently live, for the nav "Live" indicator.
 */
export function useRealtime(onEvent: Handler) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      es = new EventSource("/api/stream");

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        es?.close();
        retryTimer = setTimeout(connect, 1500);
      };
      es.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "connected") return;
          handlerRef.current(data as RealtimeEvent);
        } catch {
          // ignore malformed frame
        }
      };
    }

    connect();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, []);

  return connected;
}
