import "@/lib/init";
import { NextRequest } from "next/server";
import { bus, incClientCount } from "@/lib/bus";
import type { RealtimeEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let listener: (event: RealtimeEvent) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      incClientCount(1);
      const send = (event: RealtimeEvent | { type: "connected" }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller already closed
        }
      };

      send({ type: "connected" });
      listener = (event: RealtimeEvent) => send(event);
      bus.on("event", listener);

      // keep the connection alive through proxies/load balancers
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // ignore
        }
      }, 20000);
    },
    cancel() {
      incClientCount(-1);
      bus.off("event", listener);
      clearInterval(heartbeat);
    },
  });

  req.signal.addEventListener("abort", () => {
    incClientCount(-1);
    bus.off("event", listener);
    clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
