import { Prisma, SalonStatus, WeekDay } from "@prisma/client";
import { prisma } from "../config/db";
import { AppError } from "../utils/appError";

const days = Object.values(WeekDay);

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
    include: { services: true, hours: true },
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
      include: { services: true, hours: true },
    });
  },

  async listMine(ownerId: string) {
    return prisma.salon.findMany({
      where: { ownerId },
      include: { services: true, hours: true },
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
        await tx.salonService.deleteMany({
          where: { salonId: id },
        });

        if (services.length) {
          await tx.salonService.createMany({
            data: services.map((service: any) => ({
              salonId: id,
              name: service.name,
              description: service.description,
              durationMin: service.durationMin,
              price: new Prisma.Decimal(service.price),
              isActive: service.isActive ?? true,
            })),
          });
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
        include: { services: true, hours: true },
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
      include: { services: true, hours: true },
    });
  },

  async unpublish(ownerId: string, id: string) {
    await getOwned(ownerId, id);

    return prisma.salon.update({
      where: { id },
      data: { status: SalonStatus.UNPUBLISHED },
      include: { services: true, hours: true },
    });
  },

  async listPublic(city?: string) {
    return prisma.salon.findMany({
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

    return salon;
  },
};
