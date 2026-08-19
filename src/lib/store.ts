import { randomBytes } from "crypto";
import { emitEvent } from "./bus";
import type {
  Slot,
  Booking,
  Incident,
  Pricing,
  Employee,
  HardwareItem,
  Operator,
  DayStats,
  IncidentPriority,
} from "./types";

const TOTAL_SLOTS = 48;
const slotLabel = (i: number) => "A" + (i + 1);

interface StoreState {
  slots: Slot[];
  bookings: Booking[];

  // Secure customer booking links
  bookingTokens: Record<string, string>;
  incidents: Incident[];
  otpStore: Record<string, { code: string; expiresAt: number }>;
  counters: { booking: number; incident: number; employee: number };
  dayStats: DayStats;
  pricing: Pricing;
  employees: Employee[];
  hardware: HardwareItem[];
  operators: Operator[];
  simulationStarted: boolean;
}

const plateBank = [
  "KL-07-AB-4821",
  "KL-08-CX-1092",
  "KL-09-DZ-7734",
  "KL-07-EF-2210",
  "KL-10-GH-6650",
  "KL-07-JK-3399",
];
const randomPlate = () => plateBank[Math.floor(Math.random() * plateBank.length)];

function createInitialState(): StoreState {
  return {
    slots: Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
      index: i,
      label: slotLabel(i),
      status: Math.random() < 0.3 ? "occupied" : "available",
    })),
    bookings: [],
    bookingTokens: {},
    incidents: [],
    otpStore: {},
    counters: { booking: 1000, incident: 1000, employee: 100 },
    dayStats: { walkins: 0, revenue: 0, resolved: 0, reassigned: 0 },
    pricing: { hourly: 40 },
    employees: [
      { id: "E-101", name: "R. Menon", role: "Entry Employee", shift: "08:00–16:00" },
      { id: "E-102", name: "S. Naik", role: "Security", shift: "08:00–16:00" },
      { id: "E-103", name: "A. Pillai", role: "Entry Employee", shift: "16:00–00:00" },
    ],
    hardware: [
      { id: "H-1", name: "Entry QR Scanner", status: "online" },
      { id: "H-2", name: "Entry Boom Barrier", status: "online" },
      { id: "H-3", name: "Exit QR Scanner", status: "online" },
      { id: "H-4", name: "Exit Boom Barrier", status: "online" },
      { id: "H-5", name: "Thermal Printer", status: "online" },
      { id: "H-6", name: "Entry Desktop + UPS", status: "online" },
      { id: "H-7", name: "Occupancy Sensors (48)", status: "online" },
    ],
    operators: [
      { id: "OP-1", name: "Lulu Mall Lot A, Kochi", plan: "Pro", status: "active", live: true },
      {
        id: "OP-2",
        name: "City Hospital, Kozhikode",
        plan: "Starter",
        status: "active",
        live: false,
        mockRevenue: 8200,
        mockOccupancy: 61,
      },
      {
        id: "OP-3",
        name: "Grand Regency Hotel, Kochi",
        plan: "Pro",
        status: "active",
        live: false,
        mockRevenue: 15400,
        mockOccupancy: 74,
      },
      {
        id: "OP-4",
        name: "Infopark IT Campus",
        plan: "Enterprise",
        status: "suspended",
        live: false,
        mockRevenue: 0,
        mockOccupancy: 0,
      },
    ],
    simulationStarted: false,
  };
}

const globalForStore = globalThis as unknown as {
  __parkflowStore?: StoreState;
  __parkflowStartTime?: number;
};

export const state: StoreState = globalForStore.__parkflowStore ?? (globalForStore.__parkflowStore = createInitialState());
if (!globalForStore.__parkflowStartTime) globalForStore.__parkflowStartTime = Date.now();

export function uptimeSeconds() {
  return Math.round((Date.now() - (globalForStore.__parkflowStartTime ?? Date.now())) / 1000);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function nearestFreeSlotIndex(): number | null {
  for (let i = 0; i < TOTAL_SLOTS; i++) if (state.slots[i].status === "available") return i;
  return null;
}

export function publicSlots(): Slot[] {
  return state.slots.map((s) => ({ index: s.index, label: s.label, status: s.status }));
}

export function broadcastSlots() {
  emitEvent({ type: "slots:update", payload: publicSlots() });
}

export function findBooking(id: string) {
  return state.bookings.find((b) => b.id === id);
}
export function createBookingToken(bookingId: string) {
  // Ensure bookingTokens exists even when Next.js
  // is reusing an older global store during development.
  if (!state.bookingTokens) {
    state.bookingTokens = {};
  }

  const existingToken = state.bookingTokens[bookingId];

  if (existingToken) {
    return existingToken;
  }

  const token = randomBytes(24).toString("hex");

  state.bookingTokens[bookingId] = token;

  return token;
}

export function findBookingByToken(
  bookingId: string,
  token: string
): Booking | null {
  if (!state.bookingTokens) {
    return null;
  }
  const savedToken = state.bookingTokens[bookingId];

  if (!savedToken || savedToken !== token) {
    return null;
  }

  return findBooking(bookingId) ?? null;
}

/* ------------------------------------------------------------------ */
/* OTP                                                                  */
/* ------------------------------------------------------------------ */

export function sendOtp(mobile: string) {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  state.otpStore[mobile] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
  return code;
}

export function verifyOtp(mobile: string, code: string) {
  const entry = state.otpStore[mobile];
  if (!entry || entry.code !== code || entry.expiresAt < Date.now()) return false;
  delete state.otpStore[mobile];
  return true;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                             */
/* ------------------------------------------------------------------ */

export function createBooking(input: {
  vehicle: string;
  mobile: string;
  source?: "online" | "walkin";
  amount?: number;
  payMethod?: string;
  employeeId?: string;
  employeeName?: string;
  gateName?: string;
}): { booking: Booking } | { error: string; status: number } {
  const { vehicle, mobile } = input;
  if (!vehicle || !mobile) return { error: "vehicle and mobile are required.", status: 400 };
  const slotIndex = nearestFreeSlotIndex();
  if (slotIndex === null) return { error: "Lot is full — no free slots right now.", status: 409 };

  state.slots[slotIndex].status = "booked";
  const id = "PF-" + state.counters.booking++;
  const booking: Booking = {
    id,
    vehicle: vehicle.toUpperCase(),
    mobile,
    slotIndex,
    slotLabel: slotLabel(slotIndex),
    source: input.source || "online",

    // Only gate/walk-in bookings should have an employee.
    employeeId:
      input.source === "walkin"
        ? input.employeeId
        : undefined,

    employeeName:
      input.source === "walkin"
        ? input.employeeName
        : undefined,

    gateName:
      input.source === "walkin"
        ? input.gateName || "Entry Gate"
        : undefined,

    status: "booked",
    amount: input.amount ?? state.pricing.hourly,
    payMethod: input.payMethod || "card",
    createdAt: new Date().toISOString(),
    entryTime: null,
    exitTime: null,
  };
  state.bookings.push(booking);
  if (input.source === "walkin") {
    state.dayStats.walkins++;
    state.dayStats.revenue += Number(booking.amount) || 0;
  }

  broadcastSlots();
  emitEvent({ type: "booking:new", payload: booking });
  return { booking };
}

export function markEntry(id: string) {
  const booking = findBooking(id);
  if (!booking) return null;
  booking.status = "active";
  booking.entryTime = new Date().toISOString();
  state.slots[booking.slotIndex].status = "occupied";
  broadcastSlots();
  emitEvent({ type: "booking:update", payload: booking });
  return booking;
}

export function markExit(id: string) {
  const booking = findBooking(id);
  if (!booking) return null;
  booking.status = "completed";
  booking.exitTime = new Date().toISOString();
  state.slots[booking.slotIndex].status = "available";
  broadcastSlots();
  emitEvent({ type: "booking:update", payload: booking });
  return booking;
}

/* ------------------------------------------------------------------ */
/* Incidents                                                            */
/* ------------------------------------------------------------------ */
function sendDemoSms(
  bookingId: string,
  mobile: string,
  message: string
) {
  // Keep console SMS for development
  console.log("=================================");
  console.log("📱 PARKFLOW SMS");
  console.log("To:", mobile);
  console.log("Message:", message);
  console.log("=================================");

  // Also send SMS event to the customer dashboard
  emitEvent({
    type: "sms:sent",
    payload: {
      bookingId,
      mobile,
      message,
    },
  });
}
export function createIncident(
  booking: Booking,
  priority?: IncidentPriority
): Incident {
  // Mark the customer's assigned slot as incident
  state.slots[booking.slotIndex].status = "incident";

  const id = "INC-" + state.counters.incident++;

  const incident: Incident = {
    id,
    bookingId: booking.id,
    slotIndex: booking.slotIndex,
    slotLabel: slotLabel(booking.slotIndex),
    expectedCustomer: booking.vehicle,
    wrongVehicle: randomPlate(),
    priority: priority || (Math.random() < 0.5 ? "high" : "medium"),
    status: "active",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    fallbackSlot: null,
  };

  state.incidents.push(incident);

  // Update all dashboards immediately
  broadcastSlots();

  // Security receives the alert
  emitEvent({
    type: "incident:new",
    payload: incident,
  });

  // Customer receives the conflict alert
  emitEvent({
    type: "booking:conflict",
    payload: {
      bookingId: booking.id,
      incident,
    },
  });

  // ---------------------------------------------------------
  // CUSTOMER SMS + AUTOMATIC REASSIGNMENT
  // ---------------------------------------------------------
  //
  // booked = conflict before QR entry
  // active = customer already entered and reported conflict
  //
  // Reassignment starts immediately and happens after 7 seconds.
  //

  if (
    booking.status === "booked" ||
    booking.status === "active"
  ) {
    // Send SMS immediately
    sendDemoSms(
      booking.id,
      booking.mobile,
      [
        "ParkFlow Alert",
        "",
        `Your assigned slot ${incident.slotLabel} is occupied.`,
        "Security has been notified.",
        "",
        "We are finding another available slot for you.",
      ].join("\n")
    );
  }

  return incident;
}


export function resolveIncident(id: string) {
  const incident = state.incidents.find((i) => i.id === id);
  if (!incident) return null;
  incident.status = "resolved";
  incident.resolvedAt = new Date().toISOString();
  state.dayStats.resolved++;

  const booking = findBooking(incident.bookingId);
  if (booking) {
    state.slots[incident.slotIndex].status = booking.status === "active" ? "occupied" : "booked";
    emitEvent({
      type: "booking:resolved",
      payload: { bookingId: booking.id, slotLabel: slotLabel(incident.slotIndex) },
    });
  } else {
    state.slots[incident.slotIndex].status = "available";
  }
  broadcastSlots();
  emitEvent({ type: "incident:update", payload: incident });
  return incident;
}

export function markNotResponding(id: string) {
  const incident = state.incidents.find((i) => i.id === id);

  if (!incident) return null;

  // Do not process an incident that is already resolved/reassigned.
  if (incident.status !== "active") {
    return null;
  }

  const booking = findBooking(incident.bookingId);

  if (!booking) {
    return null;
  }

  // Reassignment is allowed only when the booking is:
  //
  // 1. "booked"  -> customer has NOT scanned QR yet.
  //                    This can happen when the customer
  //                    scans QR while the slot conflict
  //                    is still unresolved.
  //
  // 2. "active"  -> customer has already entered and
  //                 explicitly reported the occupied slot.
  //
  if (
    booking.status !== "booked" &&
    booking.status !== "active"
  ) {
    return null;
  }

  // Find the next available slot.
  const fallbackIndex = nearestFreeSlotIndex();

  // No alternative slot available.
  if (fallbackIndex === null) {
    return null;
  }

  // Make sure the fallback slot is actually available.
  if (state.slots[fallbackIndex].status !== "available") {
    return null;
  }

  const oldSlotLabel = booking.slotLabel;
  const newSlotLabel = slotLabel(fallbackIndex);

  // --------------------------------------------------
  // MARK INCIDENT AS REASSIGNED
  // --------------------------------------------------

  incident.status = "reassigned";
  incident.resolvedAt = new Date().toISOString();
  incident.fallbackSlot = newSlotLabel;

  state.dayStats.reassigned++;

  // --------------------------------------------------
  // KEEP ORIGINAL PROBLEM SLOT OCCUPIED
  // --------------------------------------------------

  state.slots[incident.slotIndex].status = "occupied";

  // --------------------------------------------------
  // ASSIGN NEW SLOT TO CUSTOMER
  // --------------------------------------------------

  booking.slotIndex = fallbackIndex;
  booking.slotLabel = newSlotLabel;

  // New slot is now reserved for this customer.
  state.slots[fallbackIndex].status = "booked";

  // --------------------------------------------------
  // CUSTOMER DASHBOARD
  // --------------------------------------------------

  emitEvent({
    type: "booking:reassigned",
    payload: {
      bookingId: booking.id,
      newSlotLabel,
    },
  });

  // --------------------------------------------------
  // UPDATE BOOKING EVERYWHERE
  // --------------------------------------------------

  emitEvent({
    type: "booking:update",
    payload: booking,
  });

  // --------------------------------------------------
  // SECURITY DASHBOARD
  // --------------------------------------------------

  emitEvent({
    type: "incident:update",
    payload: incident,
  });

  // --------------------------------------------------
  // UPDATE SLOT GRID EVERYWHERE
  // --------------------------------------------------

  broadcastSlots();

  return {
    incident,
    previousSlot: oldSlotLabel,
    fallbackSlot: newSlotLabel,
  };
}

/* ------------------------------------------------------------------ */
/* Pricing                                                              */
/* ------------------------------------------------------------------ */

export function setPricing(hourly: number) {
  state.pricing.hourly = hourly;
  emitEvent({ type: "pricing:update", payload: state.pricing });
  return state.pricing;
}

/* ------------------------------------------------------------------ */
/* Employees                                                            */
/* ------------------------------------------------------------------ */

export function addEmployee(name: string, role: string, shift?: string) {
  const employee: Employee = { id: "E-" + state.counters.employee++, name, role, shift: shift || "—" };
  state.employees.push(employee);
  emitEvent({ type: "employees:update", payload: state.employees });
  return employee;
}

export function removeEmployee(id: string) {
  state.employees = state.employees.filter((e) => e.id !== id);
  emitEvent({ type: "employees:update", payload: state.employees });
}

/* ------------------------------------------------------------------ */
/* Operators                                                            */
/* ------------------------------------------------------------------ */

export function listOperators(): Operator[] {
  return state.operators.map((op) => {
    if (!op.live) return op;
    return {
      ...op,
      liveRevenue: state.dayStats.revenue,
      liveOccupancyPct: Math.round(
        (state.slots.filter((s) => s.status !== "available").length / TOTAL_SLOTS) * 100
      ),
    };
  });
}

export function toggleOperator(id: string) {
  const op = state.operators.find((o) => o.id === id);
  if (!op) return null;
  op.status = op.status === "active" ? "suspended" : "active";
  emitEvent({ type: "operators:update", payload: state.operators });
  return op;
}

/* ------------------------------------------------------------------ */
/* Stats                                                                */
/* ------------------------------------------------------------------ */

export function getStats() {
  const bookings = state.bookings;

  const revenue = bookings.reduce(
    (sum, booking) => sum + (Number(booking.amount) || 0),
    0
  );

  const onlineRevenue = bookings
    .filter((booking) => booking.source === "online")
    .reduce(
      (sum, booking) => sum + (Number(booking.amount) || 0),
      0
    );

  const gateRevenue = bookings
    .filter((booking) => booking.source === "walkin")
    .reduce(
      (sum, booking) => sum + (Number(booking.amount) || 0),
      0
    );

  const cashRevenue = bookings
  .filter(
    (booking) =>
      booking.source === "walkin" &&
      booking.payMethod?.toLowerCase() === "cash"
  )
  .reduce(
    (sum, booking) => sum + (Number(booking.amount) || 0),
    0
  );

const cardRevenue = bookings
  .filter(
    (booking) =>
      booking.source === "walkin" &&
      booking.payMethod?.toLowerCase() === "card"
  )
  .reduce(
    (sum, booking) => sum + (Number(booking.amount) || 0),
    0
  );

const upiRevenue = bookings
  .filter(
    (booking) =>
      booking.source === "walkin" &&
      booking.payMethod?.toLowerCase() === "upi"
  )
  .reduce(
    (sum, booking) => sum + (Number(booking.amount) || 0),
    0
  );

  return {
    ...state.dayStats,

    // Revenue
    revenue,
    totalRevenue: revenue,
    onlineRevenue,
    gateRevenue,

    // Payment methods
    cashRevenue,
    cardRevenue,
    upiRevenue,

    // Booking source
    onlineBookings: bookings.filter(
      (booking) => booking.source === "online"
    ).length,

    gateBookings: bookings.filter(
      (booking) => booking.source === "walkin"
    ).length,

    // Existing stats
    activeIncidents: state.incidents.filter(
      (i) => i.status === "active"
    ).length,

    activeSessions: bookings.filter(
      (b) => b.status === "active"
    ).length,

    freeSlots: state.slots.filter(
      (s) => s.status === "available"
    ).length,

    occupancyPct: Math.round(
      (state.slots.filter(
        (s) => s.status !== "available"
      ).length / TOTAL_SLOTS) * 100
    ),
  };
}

export function getPlatformStats(connectedDashboards: number) {
  return {
    connectedDashboards,
    uptimeSeconds: uptimeSeconds(),
    activeIncidentsTotal: state.incidents.filter((i) => i.status === "active").length,
    activeSessionsTotal: state.bookings.filter((b) => b.status === "active").length,
    totalBookingsToday: state.bookings.length,
  };
}

/* ------------------------------------------------------------------ */
/* Ambient simulation                                                   */
/* ------------------------------------------------------------------ */

export function startSimulation() {
  // Do not automatically create parking incidents.
  // Incidents must come from the actual sensor event
  // or the customer's "Report slot occupied" action.
  return;
} export function handleSensorOccupied(slotIndex: number) {
  const slot = state.slots[slotIndex];

  if (!slot) {
    return null;
  }

  slot.status = "occupied";

  emitEvent({
    type: "sensor:occupied",
    payload: {
      slotIndex,
      slotLabel: slot.label,
    },
  });

  // Find a booking assigned to this slot
  const booking = state.bookings.find(
    (b) =>
      b.slotIndex === slotIndex &&
      (b.status === "booked" || b.status === "active")
  );

  if (!booking) {
    broadcastSlots();
    return null;
  }

  // Check whether an incident already exists
  const existingIncident = state.incidents.find(
    (incident) =>
      incident.bookingId === booking.id &&
      incident.status === "active"
  );

  if (existingIncident) {
    broadcastSlots();
    return existingIncident;
  }

  // --------------------------------------------------
  // BEFORE QR SCAN
  // --------------------------------------------------
  if (booking.status === "booked") {
    const incident = createIncident(booking, "high");

    // IMPORTANT:
    // createIncident should notify customer/security,
    // but should NOT immediately reassign.
    //
    // Reassignment happens only if the customer
    // later scans QR while this incident is active.

    broadcastSlots();

    return incident;
  }

  // --------------------------------------------------
  // AFTER QR SCAN
  // --------------------------------------------------
  if (booking.status === "active") {
    // Sensor cannot determine whether the vehicle
    // occupying the slot is the customer's vehicle.
    //
    // Therefore:
    // DON'T automatically reassign.
    //
    // Customer must click "Report slot occupied".
    broadcastSlots();

    return null;
  }

  broadcastSlots();

  return null;
}
