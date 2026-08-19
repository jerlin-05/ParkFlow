import { EventEmitter } from "events";
import type { RealtimeEvent } from "./types";

// Persist a single EventEmitter across Next.js hot-reloads / module re-evaluations
// in dev mode by stashing it on globalThis, exactly like we do for the data store.
const globalForBus = globalThis as unknown as {
  __parkflowBus?: EventEmitter;
  __parkflowClientCount?: number;
};

export const bus: EventEmitter =
  globalForBus.__parkflowBus ??
  (globalForBus.__parkflowBus = (() => {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    return emitter;
  })());

export function emitEvent(event: RealtimeEvent) {
  bus.emit("event", event);
}

export function getClientCount(): number {
  return globalForBus.__parkflowClientCount ?? 0;
}

export function incClientCount(delta: number) {
  globalForBus.__parkflowClientCount = Math.max(0, getClientCount() + delta);
}
