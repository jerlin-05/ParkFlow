export type SlotStatus = "available" | "booked" | "occupied" | "incident";

export interface Slot {
  index: number;
  label: string;
  status: SlotStatus;
}

export type BookingSource = "online" | "walkin";
export type BookingStatus =
  | "booked"
  | "active"
  | "completed";

export interface Booking {
  id: string;
  vehicle: string;
  mobile: string;
  slotIndex: number;
  slotLabel: string;
  source: BookingSource;
  status: BookingStatus;
  amount: number;
  payMethod: string;

  employeeId?: string;
  employeeName?: string;
  gateName?: string;

  createdAt: string;
  entryTime: string | null;
  exitTime: string | null;
}

export type IncidentPriority = "high" | "medium";
export type IncidentStatus = "active" | "resolved" | "reassigned";

export interface Incident {
  id: string;
  bookingId: string;
  slotIndex: number;
  slotLabel: string;
  expectedCustomer: string;
  wrongVehicle: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
  fallbackSlot: string | null;
}

export interface Pricing {
  hourly: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  shift: string;
}

export type HardwareStatus = "online" | "offline";

export interface HardwareItem {
  id: string;
  name: string;
  status: HardwareStatus;
}

export interface Operator {
  id: string;
  name: string;
  plan: "Starter" | "Pro" | "Enterprise";
  status: "active" | "suspended";
  live: boolean;
  mockRevenue?: number;
  mockOccupancy?: number;
  liveRevenue?: number;
  liveOccupancyPct?: number;
}

export interface DayStats {
  walkins: number;
  revenue: number;
  resolved: number;
  reassigned: number;
}

export interface Stats extends DayStats {
  activeIncidents: number;
  activeSessions: number;
  freeSlots: number;
  occupancyPct: number;
}

export interface PlatformStats {
  connectedDashboards: number;
  uptimeSeconds: number;
  activeIncidentsTotal: number;
  activeSessionsTotal: number;
  totalBookingsToday: number;
}

/** Real-time event names shared between server (SSE) and client (EventSource). */
export type RealtimeEvent =
  | {
    type: "sms:sent";
    payload: {
      bookingId: string;
      mobile: string;
      message: string;
    };
  }
  | {
    type: "sensor:occupied";
    payload: {
      slotIndex: number;
      slotLabel: string;
    };
  }
  | { type: "slots:update"; payload: Slot[] }
  | { type: "booking:new"; payload: Booking }
  | { type: "booking:update"; payload: Booking }
  | { type: "booking:conflict"; payload: { bookingId: string; incident: Incident } }
  | { type: "booking:resolved"; payload: { bookingId: string; slotLabel: string } }
  | { type: "booking:reassigned"; payload: { bookingId: string; newSlotLabel: string } }
  | { type: "incident:new"; payload: Incident }
  | { type: "incident:update"; payload: Incident }
  | { type: "pricing:update"; payload: Pricing }
  | { type: "employees:update"; payload: Employee[] }
  | { type: "operators:update"; payload: Operator[] };
 
