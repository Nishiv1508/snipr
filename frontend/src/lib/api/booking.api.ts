import { api } from "@/lib/api";

// ---------- Types ----------

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface AvailableSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  availableCount: number;
  isAvailable: boolean;
}

export interface AvailableSlotsResponse {
  salonId: string;
  date: string;
  timezone: string;
  slots: AvailableSlot[];
}

export interface CreateBookingInput {
  slotId: string;
  serviceIds: string[];
}

export interface BookingServiceItem {
  id: string;
  position: number;
  serviceName: string;
  servicePrice: string;
  serviceDurationMin: number;
  startsAt: string;
  endsAt: string;
}

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
  items: BookingServiceItem[];
  customer?: {
    id: string;
    email: string;
  };
}

export interface BookingTicket {
  reference: string;
  // Ticket endpoints may return a PDF rather than JSON.
}

export interface VerifyTicketInput {
  key: string;
}

export interface VerifyTicketResponse {
  valid: boolean;
  booking: {
    id: string;
    reference: string;
    status: BookingStatus;
    customerEmail: string;
    services: {
      serviceName: string;
      servicePrice: string;
      serviceDurationMin: number;
      startsAt: string;
      endsAt: string;
    }[];
    salonName?: string;
    timezone: string;
  };
}

// ---------- Helpers ----------

function unwrapData<T>(responseData: unknown): T {
  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "data" in responseData
  ) {
    return (responseData as { data: T }).data;
  }

  return responseData as T;
}

// ---------- Customer API ----------

export async function getAvailableSlots(
  salonId: string,
  date: string,
): Promise<AvailableSlotsResponse> {
  const response = await api.get(`/public/salons/${salonId}/slots`, {
    params: { date },
  });

  return unwrapData<AvailableSlotsResponse>(response.data);
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const response = await api.post("/bookings", input);

  return unwrapData<Booking>(response.data);
}

export async function getMyBookings(): Promise<Booking[]> {
  const response = await api.get("/bookings/me");

  return unwrapData<Booking[]>(response.data);
}

export async function cancelBooking(
  bookingId: string,
): Promise<{ cancelled: boolean; alreadyCancelled?: boolean }> {
  const response = await api.post(`/bookings/${bookingId}/cancel`);

  return unwrapData(response.data);
}

// ---------- Ticket API ----------

export async function downloadBookingTicket(bookingId: string): Promise<Blob> {
  const response = await api.get(`/bookings/${bookingId}/ticket`, {
    responseType: "blob",
  });

  return response.data;
}

// ---------- Owner API ----------

export async function getOwnerBookings(date?: string): Promise<Booking[]> {
  const response = await api.get("/owner/bookings", {
    params: date ? { date } : undefined,
  });

  return unwrapData<Booking[]>(response.data);
}

export async function verifyBookingTicket(
  bookingId: string,
  input: VerifyTicketInput,
): Promise<VerifyTicketResponse> {
  const response = await api.post(`/owner/bookings/${bookingId}/verify`, input);

  return unwrapData<VerifyTicketResponse>(response.data);
}
