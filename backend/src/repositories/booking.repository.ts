import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";

class BookingTransactionError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "BookingTransactionError";
  }
}

export const bookingRepository = {
  findPublishedSalonWithHours(salonId: string) {
    return prisma.salon.findFirst({
      where: { id: salonId, status: "PUBLISHED" },
      include: { hours: true },
    });
  },

  upsertSlot(salonId: string, startsAt: Date, endsAt: Date, capacity: number) {
    return prisma.bookingSlot.upsert({
      where: {
        salonId_startsAt: { salonId, startsAt },
      },
      create: {
        salonId,
        startsAt,
        endsAt,
        capacity,
        bookedCount: 0,
      },
      update: {},
    });
  },

  findSlotsForDay(salonId: string, start: Date, end: Date) {
    return prisma.bookingSlot.findMany({
      where: {
        salonId,
        startsAt: { gte: start, lt: end },
      },
      orderBy: { startsAt: "asc" },
    });
  },

  async createBookingAtomically(input: {
    customerId: string;
    slotId: string;
    serviceIds: string[];
    reference: string;
    ticketKeyHash: string;
    ticketKeyEnc: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const startingSlot = await tx.bookingSlot.findUnique({
          where: { id: input.slotId },
          include: {
            salon: {
              select: { id: true, status: true },
            },
          },
        });

        if (!startingSlot || startingSlot.salon.status !== "PUBLISHED") {
          throw new BookingTransactionError("SLOT_NOT_FOUND");
        }

        const now = new Date();

        if (startingSlot.startsAt <= now) {
          throw new BookingTransactionError("SLOT_IN_PAST");
        }

        if (
          input.serviceIds.length === 0 ||
          new Set(input.serviceIds).size !== input.serviceIds.length
        ) {
          throw new BookingTransactionError("INVALID_SERVICES");
        }

        const services = await tx.salonService.findMany({
          where: {
            id: { in: input.serviceIds },
            salonId: startingSlot.salonId,
            isActive: true,
          },
        });

        if (services.length !== input.serviceIds.length) {
          throw new BookingTransactionError("SERVICE_NOT_FOUND");
        }

        const servicesById = new Map(
          services.map((service) => [service.id, service]),
        );

        // Keep the exact order chosen by the customer.
        const orderedServices = input.serviceIds.map((id) =>
          servicesById.get(id)!,
        );

        if (orderedServices.some((service) => service.durationMin <= 0)) {
          throw new BookingTransactionError("INVALID_SERVICES");
        }

        const appointmentStart = startingSlot.startsAt;
        const totalDurationMin = orderedServices.reduce(
          (total, service) => total + service.durationMin,
          0,
        );

        const appointmentEnd = new Date(
          appointmentStart.getTime() + totalDurationMin * 60_000,
        );

        // Find every hourly slot that the appointment overlaps.
        // The end is exclusive: a slot beginning exactly when the
        // appointment ends must not be reserved.
        const slots = await tx.bookingSlot.findMany({
          where: {
            salonId: startingSlot.salonId,
            startsAt: {
              gte: appointmentStart,
              lt: appointmentEnd,
            },
          },
          orderBy: { startsAt: "asc" },
        });

        if (slots.length === 0 || slots[0].id !== startingSlot.id) {
          throw new BookingTransactionError("CONSECUTIVE_SLOTS_UNAVAILABLE");
        }

        // Ensure there are no gaps and the slots cover the full appointment.
        let expectedStart = appointmentStart;

        for (const slot of slots) {
          if (
            slot.startsAt.getTime() !== expectedStart.getTime() ||
            slot.endsAt.getTime() <= slot.startsAt.getTime() ||
            slot.startsAt <= now
          ) {
            throw new BookingTransactionError("CONSECUTIVE_SLOTS_UNAVAILABLE");
          }

          expectedStart = slot.endsAt;
        }

        if (expectedStart < appointmentEnd) {
          throw new BookingTransactionError("CONSECUTIVE_SLOTS_UNAVAILABLE");
        }

        // Reserve each affected hourly slot once for this booking.
        // updateMany provides an atomic capacity check.
        for (const slot of slots) {
          const reserved = await tx.bookingSlot.updateMany({
            where: {
              id: slot.id,
              bookedCount: { lt: slot.capacity },
            },
            data: {
              bookedCount: { increment: 1 },
            },
          });

          if (reserved.count !== 1) {
            throw new BookingTransactionError("SLOT_FULL");
          }
        }

        // Calculate the actual start/end of each service.
        // slotId points to the hourly slot in which that service starts.
        let serviceStart = appointmentStart;

        const bookingItems = orderedServices.map((service, index) => {
          const serviceEnd = new Date(
            serviceStart.getTime() + service.durationMin * 60_000,
          );

          const serviceStartSlot = slots.find(
            (slot) =>
              slot.startsAt <= serviceStart && serviceStart < slot.endsAt,
          );

          if (!serviceStartSlot) {
            throw new BookingTransactionError("CONSECUTIVE_SLOTS_UNAVAILABLE");
          }

          const item = {
            slotId: serviceStartSlot.id,
            serviceId: service.id,
            serviceName: service.name,
            servicePrice: service.price,
            serviceDurationMin: service.durationMin,
            position: index,
            startsAt: serviceStart,
            endsAt: serviceEnd,
          };

          serviceStart = serviceEnd;
          return item;
        });

        const booking = await tx.booking.create({
          data: {
            customerId: input.customerId,
            reference: input.reference,
            ticketKeyHash: input.ticketKeyHash,
            ticketKeyEnc: input.ticketKeyEnc,
            status: "CONFIRMED",

            items: {
              create: bookingItems,
            },

            slotReservations: {
              create: slots.map((slot) => ({
                slot: {
                  connect: { id: slot.id },
                },
              })),
            },
          },
          select: {
            id: true,
            reference: true,
            status: true,
            createdAt: true,
            items: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                position: true,
                serviceName: true,
                servicePrice: true,
                serviceDurationMin: true,
                startsAt: true,
                endsAt: true,
              },
            },
          },
        });

        return { booking };
      });
    } catch (error) {
      if (error instanceof BookingTransactionError) {
        return {
          error: error.code as
            | "SLOT_NOT_FOUND"
            | "SLOT_IN_PAST"
            | "SERVICE_NOT_FOUND"
            | "INVALID_SERVICES"
            | "CONSECUTIVE_SLOTS_UNAVAILABLE"
            | "SLOT_FULL",
        };
      }

      throw error;
    }
  },

  findCustomerBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        status: true,
        cancelledAt: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            position: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,

            // Actual service appointment times
            startsAt: true,
            endsAt: true,

            slot: {
              select: {
                startsAt: true,
                endsAt: true,
                salon: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    address: true,
                    city: true,
                    timezone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  findCustomerBooking(customerId: string, bookingId: string) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId,
      },
      include: {
        items: {
          select: {
            id: true,
            position: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,

            // Actual service appointment times
            startsAt: true,
            endsAt: true,

            slot: {
              select: {
                startsAt: true,
                endsAt: true,
                salon: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    address: true,
                    city: true,
                    timezone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  cancelBookingAtomically(customerId: string, bookingId: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          customerId,
        },
        select: {
          id: true,
          status: true,
          slotReservations: {
            select: {
              slotId: true,
            },
          },
        },
      });

      if (!booking) {
        return { error: "BOOKING_NOT_FOUND" as const };
      }

      if (booking.status === "CANCELLED") {
        return { alreadyCancelled: true as const };
      }

      if (booking.status !== "CONFIRMED") {
        return { error: "BOOKING_NOT_CANCELLABLE" as const };
      }

      const changed = await tx.booking.updateMany({
        where: {
          id: booking.id,
          customerId,
          status: "CONFIRMED",
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (changed.count !== 1) {
        return { error: "BOOKING_STATE_CHANGED" as const };
      }

      for (const reservation of booking.slotReservations) {
        const updated = await tx.bookingSlot.updateMany({
          where: {
            id: reservation.slotId,
            bookedCount: { gt: 0 },
          },
          data: {
            bookedCount: { decrement: 1 },
          },
        });

        if (updated.count !== 1) {
          throw new Error("Booking slot capacity counter is inconsistent");
        }
      }

      return { cancelled: true as const };
    });
  },

  findOwnerBookings(ownerId: string) {
    return prisma.booking.findMany({
      where: {
        items: {
          some: {
            slot: {
              salon: { ownerId },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
        customer: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            position: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,

            // Actual service appointment times
            startsAt: true,
            endsAt: true,

            slot: {
              select: {
                startsAt: true,
                endsAt: true,
                salon: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    address: true,
                    city: true,
                    timezone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  findBookingForOwnerVerification(ownerId: string, bookingId: string) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
        items: {
          some: {
            slot: {
              salon: { ownerId },
            },
          },
        },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        ticketKeyHash: true,
        customer: {
          select: {
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            position: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,

            // Actual service appointment times
            startsAt: true,
            endsAt: true,

            slot: {
              select: {
                startsAt: true,
                endsAt: true,
                salon: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    address: true,
                    city: true,
                    timezone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
};
