import { Prisma, SalonStatus, WeekDay } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/appError";

function validateHours(
  hours: {
    day: WeekDay;
    isClosed: boolean;
    opensAt?: string | null;
    closesAt?: string | null;
  }[],
) {
  if (hours.length !== 7 || new Set(hours.map((h) => h.day)).size !== 7) {
    throw new AppError(
      400,
      "INVALID_HOURS",
      "Provide exactly one schedule for each weekday",
    );
  }

  for (const hour of hours) {
    if (!hour.isClosed) {
      if (!hour.opensAt || !hour.closesAt || hour.opensAt >= hour.closesAt) {
        throw new AppError(
          400,
          "INVALID_HOURS",
          "Each open day needs valid opening and closing times",
        );
      }
    }
  }
}

async function getOwned(ownerId: string, id: string) {
  const salon = await prisma.salon.findFirst({
    where: { id, ownerId },
    include: { services: { where: { isActive: true } }, hours: true },
  });

  if (!salon) {
    throw new AppError(404, "SALON_NOT_FOUND", "Salon not found");
  }

  return salon;
}

export const salonService = {
  async create(ownerId: string, input: any) {
    const { services = [], hours = [], ...details } = input;

    if (hours.length) validateHours(hours);

    return prisma.salon.create({
      data: {
        ...details,
        owner: { connect: { id: ownerId } },
        status: SalonStatus.DRAFT,
        services: {
          create: services.map((service: any) => ({
            ...service,
            price: new Prisma.Decimal(service.price),
          })),
        },
        hours: {
          create: hours,
        },
      },
      include: { services: { where: { isActive: true } }, hours: true },
    });
  },

  async listMine(ownerId: string) {
    return prisma.salon.findMany({
      where: { ownerId },
      include: { services: { where: { isActive: true } }, hours: true },
      orderBy: { createdAt: "desc" },
    });
  },

  getMine: getOwned,

  async update(ownerId: string, id: string, input: any) {
    const existing = await getOwned(ownerId, id);
    const { services, hours, ...details } = input;

    if (hours !== undefined) validateHours(hours);

    return prisma.$transaction(async (tx) => {
      await tx.salon.update({
        where: { id: existing.id },
        data: details,
      });

      if (services !== undefined) {
        const existingServices = await tx.salonService.findMany({
          where: { salonId: id },
          select: { id: true },
        });

        const existingIds = new Set(
          existingServices.map((service) => service.id),
        );
        const incomingIds = services
          .filter((service: any) => service.id)
          .map((service: any) => service.id as string);

        // Reject duplicate IDs in the request; otherwise one record could be
        // processed more than once and make reconciliation ambiguous.
        if (new Set(incomingIds).size !== incomingIds.length) {
          throw new AppError(
            400,
            "DUPLICATE_SERVICE_IDS",
            "The same service was submitted more than once",
          );
        }

        // Every submitted ID must refer to a service owned by this salon.
        if (
          incomingIds.some((serviceId: string) => !existingIds.has(serviceId))
        ) {
          throw new AppError(
            400,
            "INVALID_SERVICE",
            "One or more services do not belong to this salon",
          );
        }

        // Existing records are updated strictly by ID. New rows have no ID.
        // Do not match by name: names can change and must not determine identity.
        for (const service of services) {
          const data = {
            name: service.name,
            description: service.description ?? null,
            durationMin: service.durationMin,
            price: new Prisma.Decimal(service.price),
            isActive: service.isActive ?? true,
          };

          if (service.id) {
            await tx.salonService.update({
              where: { id: service.id },
              data,
            });
          } else {
            await tx.salonService.create({
              data: {
                salonId: id,
                ...data,
              },
            });
          }
        }

        // Remove only services omitted from the submitted list. Services
        // referenced by booking history are retained but deactivated.
        const incomingIdSet = new Set(incomingIds);
        const removedServices = existingServices.filter(
          (service) => !incomingIdSet.has(service.id),
        );

        for (const service of removedServices) {
          const bookingItemCount = await tx.bookingItem.count({
            where: { serviceId: service.id },
          });

          if (bookingItemCount > 0) {
            await tx.salonService.update({
              where: { id: service.id },
              data: { isActive: false },
            });
          } else {
            await tx.salonService.delete({
              where: { id: service.id },
            });
          }
        }
      }

      if (hours !== undefined) {
        await tx.salonHours.deleteMany({ where: { salonId: id } });

        if (hours.length) {
          await tx.salonHours.createMany({
            data: hours.map((hour: any) => ({
              salonId: id,
              day: hour.day,
              isClosed: hour.isClosed,
              opensAt: hour.isClosed ? null : hour.opensAt,
              closesAt: hour.isClosed ? null : hour.closesAt,
            })),
          });
        }
      }

      return tx.salon.findUniqueOrThrow({
        where: { id },
        include: { services: { where: { isActive: true } }, hours: true },
      });
    });
  },

  async publish(ownerId: string, id: string) {
    const salon = await getOwned(ownerId, id);

    if (!salon.name || !salon.address || !salon.city || !salon.state) {
      throw new AppError(
        400,
        "SALON_INCOMPLETE",
        "Complete the salon's required details before publishing",
      );
    }

    if (!salon.services.some((service) => service.isActive)) {
      throw new AppError(
        400,
        "NO_ACTIVE_SERVICES",
        "Add at least one active service before publishing",
      );
    }

    if (salon.hours.length !== 7) {
      throw new AppError(
        400,
        "HOURS_INCOMPLETE",
        "Set opening hours for all seven days before publishing",
      );
    }

    validateHours(salon.hours);

    return prisma.salon.update({
      where: { id },
      data: {
        status: SalonStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { services: { where: { isActive: true } }, hours: true },
    });
  },

  async unpublish(ownerId: string, id: string) {
    await getOwned(ownerId, id);

    return prisma.salon.update({
      where: { id },
      data: { status: SalonStatus.UNPUBLISHED },
      include: { services: { where: { isActive: true } }, hours: true },
    });
  },

  async listPublic(city?: string) {
    const salons = await prisma.salon.findMany({
      where: {
        status: SalonStatus.PUBLISHED,
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      },
      include: {
        services: { where: { isActive: true } },
        hours: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    if (salons.length === 0) return salons;

    const ratingSummaries = await prisma.salonRating.groupBy({
      by: ["salonId"],
      where: { salonId: { in: salons.map((salon) => salon.id) } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const summaryBySalonId = new Map(
      ratingSummaries.map((summary) => [summary.salonId, summary]),
    );

    return salons.map((salon) => {
      const summary = summaryBySalonId.get(salon.id);

      return {
        ...salon,
        averageRating: summary?._avg.rating ?? null,
        ratingCount: summary?._count._all ?? 0,
      };
    });
  },

  async getPublic(id: string) {
    const salon = await prisma.salon.findFirst({
      where: { id, status: SalonStatus.PUBLISHED },
      include: {
        services: { where: { isActive: true } },
        hours: true,
      },
    });

    if (!salon) {
      throw new AppError(404, "SALON_NOT_FOUND", "Salon not found");
    }

    const ratingSummary = await prisma.salonRating.aggregate({
      where: { salonId: salon.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      ...salon,
      averageRating: ratingSummary._avg.rating ?? null,
      ratingCount: ratingSummary._count._all,
    };
  },

  async updateCapacity(ownerId: string, id: string, capacity: number) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const salon = await tx.salon.findFirst({
        where: { id, ownerId },
        select: { id: true },
      });

      if (!salon) {
        throw new AppError(404, "SALON_NOT_FOUND", "Salon not found");
      }

      // Update only future slots that can safely support the new capacity.
      const updatedSlots = await tx.bookingSlot.updateMany({
        where: {
          salonId: id,
          startsAt: { gt: now },
          bookedCount: { lte: capacity },
        },
        data: { capacity },
      });

      const futureSlotCount = await tx.bookingSlot.count({
        where: {
          salonId: id,
          startsAt: { gt: now },
        },
      });

      if (updatedSlots.count !== futureSlotCount) {
        throw new AppError(
          409,
          "CAPACITY_BELOW_BOOKINGS",
          "Capacity cannot be lower than the number of existing bookings in a future time slot",
        );
      }

      return tx.salon.update({
        where: { id },
        data: { defaultBookingCapacity: capacity },
        select: {
          id: true,
          name: true,
          defaultBookingCapacity: true,
        },
      });
    });
  },
};
