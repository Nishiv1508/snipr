import { Prisma, SalonStatus } from "@prisma/client";
import { prisma } from "../config/db";

const salonInclude = {
  services: true,
  hours: true,
} satisfies Prisma.SalonInclude;

export const salonRepository = {
  create(ownerId: string, data: Prisma.SalonCreateInput) {
    return prisma.salon.create({
      data,
      include: salonInclude,
    });
  },

  findMine(ownerId: string) {
    return prisma.salon.findMany({
      where: { ownerId },
      include: salonInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findOwned(ownerId: string, id: string) {
    return prisma.salon.findFirst({
      where: { id, ownerId },
      include: salonInclude,
    });
  },

  updateOwned(ownerId: string, id: string, data: Prisma.SalonUpdateInput) {
    return prisma.salon.updateMany({
      where: { id, ownerId },
      data,
    });
  },

  async findPublished(id: string) {
    return prisma.salon.findFirst({
      where: {
        id,
        status: SalonStatus.PUBLISHED,
      },
      include: {
        services: {
          where: { isActive: true },
        },
        hours: true,
      },
    });
  },

  findPublishedList(city?: string) {
    return prisma.salon.findMany({
      where: {
        status: SalonStatus.PUBLISHED,
        ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      },
      include: {
        services: {
          where: { isActive: true },
        },
        hours: true,
      },
      orderBy: { publishedAt: "desc" },
    });
  },
};
