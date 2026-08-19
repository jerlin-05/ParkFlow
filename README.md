# ParkFlow — Smart Parking Operating System

A full-stack **Next.js 14 (App Router) + TypeScript** rewrite of the original ParkFlow demo.
One shared in-memory backend, five real-time role dashboards, all built with a
professional dark UI and Tailwind CSS.

## What changed from the original

- **Framework**: static HTML/CSS/JS + Express/Socket.IO → **Next.js 14 + TypeScript**,
  using the App Router, React Server/Client Components, and Route Handlers for the API.
- **Real-time layer**: Socket.IO replaced with **Server-Sent Events** (`/api/stream`),
  which fits serverless/edge-friendly Next.js deployments without a custom server.
- **UI**: rebuilt with Tailwind CSS and a shared component library (`Button`, `Card`,
  `Badge`, `StatCard`, `SlotGrid`, dashboard shell) for a more polished, consistent,
  professional look — refined spacing, subtle gradients, glass panels, and micro-interactions
  — while keeping the recognizable amber/green/red "parking operations" identity.
- **Type safety**: the entire domain model (slots, bookings, incidents, operators, etc.)
  is defined once in `src/lib/types.ts` and shared between the server store, API routes,
  and every page.
- **Data layer**: the original `server.js` logic (nearest-free-slot booking, OTP, incident
  simulation, reassignment) was ported into `src/lib/store.ts`, an in-memory store that
  survives Next.js hot-reload via `globalThis`.

## Pages

| Route         | Role              | Highlights                                              |
|---------------|-------------------|-----------------------------------------------------------|
| `/`           | Landing page      | Role picker                                               |
| `/customer`   | Customer          | 5-step booking wizard, OTP, geofence check, QR ticket, live session |
| `/employee`   | Entry Gate staff  | Walk-in booking, thermal ticket preview, gate control, search |
| `/security`   | Security desk     | Live incident queue, resolve/reassign, vehicle lookup, history |
| `/owner`      | Parking owner     | Revenue & booking-source charts, pricing, staff roster, hardware, incident history |
| `/admin`      | ParkFlow admin    | Multi-tenant operator list, platform monitoring, support panel |

All five pages (plus the landing page) share **one live backend** — a booking made on
`/customer` instantly shows up on `/employee`, `/security`, `/owner`, and `/admin`.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

> **Note:** `npm run build` fetches the Google Fonts (Archivo, Space Grotesk, Inter,
> IBM Plex Mono) used in `src/app/layout.tsx` at build time via `next/font/google`.
> Make sure the build machine has internet access to `fonts.googleapis.com`. If you're
> building somewhere fully offline, swap the `next/font/google` imports in
> `src/app/layout.tsx` for local fonts or system font stacks.

## Project structure

```
src/
  app/
    page.tsx                # landing page
    customer/page.tsx        # customer booking wizard
    employee/page.tsx        # entry gate dashboard
    security/page.tsx        # security dashboard
    owner/page.tsx            # owner dashboard
    admin/page.tsx             # super admin dashboard
    api/                       # Route Handlers (REST + SSE)
      slots/ bookings/ incidents/ pricing/ employees/
      hardware/ operators/ platform/ stats/ otp/ stream/
  components/
    ui/                        # Button, Card, Badge, StatCard, SlotGrid, Toast, ConnStatus
    DashboardShell.tsx          # shared sidebar + topbar layout for staff dashboards
  hooks/
    useRealtime.ts               # EventSource hook, auto-reconnect
  lib/
    types.ts                      # shared domain types
    store.ts                       # in-memory data store + business logic (ported from server.js)
    bus.ts                          # pub/sub used to fan out SSE events
    init.ts                          # boots the ambient occupancy/incident simulation once
```

## Notes on the data layer

This is a **demo backend**: all data lives in memory (`globalThis`) and resets when the
server process restarts. It's a straightforward drop-in to swap for a real database
(Postgres, etc.) — the functions in `src/lib/store.ts` are the seam to do that; the API
routes and pages don't need to change.
