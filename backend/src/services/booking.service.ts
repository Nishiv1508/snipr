import { randomBytes, timingSafeEqual } from "crypto";
import { fromZonedTime } from "date-fns-tz";
import { bookingRepository } from "../repositories/booking.repository";
import { AppError } from "../utils/appError";
import {
  createTicketPdf,
  decryptTicketKey,
  encryptTicketKey,
  generateTicketKey,
  hashTicketKey,
} from "../utils/booking-ticket";

function fail(status: number, code: string, message: string): never {
  throw new AppError(status, code, message);
}

function parseDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return fail(400, "INVALID_DATE", "Date must use YYYY-MM-DD format");
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return fail(400, "INVALID_DATE", "The supplied date is not valid");
  }

  return parsed;
}

function localWeekDay(date: Date): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[date.getUTCDay()];
}

function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);

  if (!match) {
    return fail(
      500,
      "INVALID_SALON_HOURS",
      "Salon opening hours have an invalid time format",
    );
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return fail(
      500,
      "INVALID_SALON_HOURS",
      "Salon opening hours contain an invalid time",
    );
  }

  return hours * 60 + minutes;
}

function localDateTime(date: string, minutes: number, timezone: string): Date {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");

  return fromZonedTime(`${date}T${hour}:${minute}:00`, timezone);
}

function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) {
    return false;
  }

  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function generateReferenceSuffix(): string {
  return randomBytes(6).toString("hex").toUpperCase();
}

function priceToString(price: unknown): string {
  return String(price);
}

export const bookingService = {
  async getAvailableSlots(salonId: string, dateValue: string) {
    const parsedDate = parseDate(dateValue);

    const salon = await bookingRepository.findPublishedSalonWithHours(salonId);

    if (!salon) {
      return fail(404, "SALON_NOT_FOUND", "Published salon not found");
    }

    const timezone = salon.timezone || "Asia/Kolkata";
    const weekday = localWeekDay(parsedDate);

    const hours = salon.hours.find(
      (item) => String(item.day).toUpperCase() === weekday,
    );

    if (!hours || hours.isClosed || !hours.opensAt || !hours.closesAt) {
      return {
        salonId,
        date: dateValue,
        timezone,
        slots: [],
      };
    }

    const openMinutes = timeToMinutes(hours.opensAt);
    const closeMinutes = timeToMinutes(hours.closesAt);

    if (closeMinutes <= openMinutes) {
      return fail(
        500,
        "INVALID_SALON_HOURS",
        "Salon closing time must be later than opening time",
      );
    }

    const slotStarts: { startsAt: Date; endsAt: Date }[] = [];

    for (let minute = openMinutes; minute + 60 <= closeMinutes; minute += 60) {
      const startsAt = localDateTime(dateValue, minute, timezone);
      const endsAt = localDateTime(dateValue, minute + 60, timezone);

      if (startsAt > new Date()) {
        slotStarts.push({ startsAt, endsAt });
      }
    }

    await Promise.all(
      slotStarts.map(({ startsAt, endsAt }) =>
        bookingRepository.upsertSlot(
          salon.id,
          startsAt,
          endsAt,
          salon.defaultBookingCapacity,
        ),
      ),
    );

    const dayStart = fromZonedTime(`${dateValue}T00:00:00`, timezone);

    const nextDate = new Date(parsedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const nextDateText = nextDate.toISOString().slice(0, 10);
    const dayEnd = fromZonedTime(`${nextDateText}T00:00:00`, timezone);

    const persistedSlots = await bookingRepository.findSlotsForDay(
      salon.id,
      dayStart,
      dayEnd,
    );

    const validStarts = new Set(
      slotStarts.map(({ startsAt }) => startsAt.getTime()),
    );

    return {
      salonId: salon.id,
      date: dateValue,
      timezone,
      slots: persistedSlots
        .filter(
          (slot) =>
            validStarts.has(slot.startsAt.getTime()) &&
            slot.startsAt > new Date(),
        )
        .map((slot) => ({
          id: slot.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          capacity: slot.capacity,
          bookedCount: slot.bookedCount,
          availableCount: Math.max(slot.capacity - slot.bookedCount, 0),
          isAvailable: slot.bookedCount < slot.capacity,
        })),
    };
  },

  async createBooking(
    customerId: string,
    input: {
      slotId: string;
      serviceIds: string[];
    },
  ) {
    if (
      input.serviceIds.length < 1 ||
      input.serviceIds.length > 10 ||
      new Set(input.serviceIds).size !== input.serviceIds.length
    ) {
      return fail(
        400,
        "INVALID_SERVICES",
        "Select between 1 and 10 unique services",
      );
    }

    const ticketKey = generateTicketKey();
    const reference = `SNP-${generateReferenceSuffix()}`;

    const result = await bookingRepository.createBookingAtomically({
      customerId,
      slotId: input.slotId,
      serviceIds: input.serviceIds,
      reference,
      ticketKeyHash: hashTicketKey(ticketKey),
      ticketKeyEnc: encryptTicketKey(ticketKey),
    });

    if ("error" in result) {
      switch (result.error) {
        case "SLOT_NOT_FOUND":
          return fail(
            404,
            "SLOT_NOT_FOUND",
            "Available booking slot not found",
          );

        case "SERVICE_NOT_FOUND":
          return fail(
            400,
            "INVALID_SERVICE",
            "A selected service is inactive or does not belong to this salon",
          );

        case "INVALID_SERVICES":
          return fail(400, "INVALID_SERVICES", "Select unique services");

        case "SLOT_IN_PAST":
          return fail(400, "SLOT_IN_PAST", "You cannot book a past time slot");

        case "SLOT_FULL":
        case "CONSECUTIVE_SLOTS_UNAVAILABLE":
          return fail(
            409,
            "SLOTS_UNAVAILABLE",
            "One or more required hourly slots are unavailable. Please select another starting time.",
          );
      }
    }

    return result.booking;
  },

  async listMyBookings(customerId: string) {
    return bookingRepository.findCustomerBookings(customerId);
  },

  async downloadTicket(customerId: string, bookingId: string) {
    const booking = await bookingRepository.findCustomerBooking(
      customerId,
      bookingId,
    );

    if (!booking) {
      return fail(404, "BOOKING_NOT_FOUND", "Booking not found");
    }

    if (booking.status !== "CONFIRMED") {
      return fail(
        409,
        "TICKET_UNAVAILABLE",
        "A ticket is available only for a confirmed booking",
      );
    }

    if (booking.items.length === 0) {
      return fail(
        409,
        "TICKET_UNAVAILABLE",
        "This booking has no reserved services",
      );
    }

    const ticketKey = decryptTicketKey(booking.ticketKeyEnc);
    const firstItem = booking.items[0];
    const salon = firstItem.slot.salon;

    const buffer = await createTicketPdf({
      reference: booking.reference,
      salonName: salon.name,
      salonAddress: [salon.address, salon.city].filter(Boolean).join(", "),
      services: booking.items.map((item) => ({
        name: item.serviceName,
        price: priceToString(item.servicePrice),
        durationMin: item.serviceDurationMin,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
      })),
      timezone: salon.timezone || "Asia/Kolkata",
      ticketKey,
    });

    return {
      reference: booking.reference,
      buffer,
    };
  },

  async cancelBooking(customerId: string, bookingId: string) {
    const result = await bookingRepository.cancelBookingAtomically(
      customerId,
      bookingId,
    );

    if ("error" in result) {
      switch (result.error) {
        case "BOOKING_NOT_FOUND":
          return fail(404, "BOOKING_NOT_FOUND", "Booking not found");

        case "BOOKING_NOT_CANCELLABLE":
          return fail(
            409,
            "BOOKING_NOT_CANCELLABLE",
            "Only confirmed bookings can be cancelled",
          );

        case "BOOKING_STATE_CHANGED":
          return fail(
            409,
            "BOOKING_STATE_CHANGED",
            "Booking status changed; please reload and try again",
          );
      }
    }

    return {
      cancelled: true,
      alreadyCancelled: "alreadyCancelled" in result,
    };
  },

  async listOwnerBookings(ownerId: string) {
    return bookingRepository.findOwnerBookings(ownerId);
  },

  async verifyTicket(ownerId: string, bookingId: string, submittedKey: string) {
    const booking = await bookingRepository.findBookingForOwnerVerification(
      ownerId,
      bookingId,
    );

    if (!booking) {
      return fail(
        404,
        "BOOKING_NOT_FOUND",
        "Booking not found for a salon you own",
      );
    }

    if (booking.status !== "CONFIRMED") {
      return fail(
        409,
        "BOOKING_NOT_ACTIVE",
        "This booking is not currently confirmed",
      );
    }

    const submittedHash = hashTicketKey(submittedKey);

    if (!safeEqualHex(booking.ticketKeyHash, submittedHash)) {
      return fail(400, "INVALID_TICKET_KEY", "Ticket key is invalid");
    }

    return {
      valid: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        customerEmail: booking.customer.email,
        services: booking.items.map((item) => ({
          serviceName: item.serviceName,
          servicePrice: priceToString(item.servicePrice),
          serviceDurationMin: item.serviceDurationMin,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
        })),
        salonName: booking.items[0]?.slot.salon.name,
        timezone: booking.items[0]?.slot.salon.timezone || "Asia/Kolkata",
      },
    };
  },
};
