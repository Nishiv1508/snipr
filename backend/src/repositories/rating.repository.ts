import { prisma } from "../config/db";

export const ratingRepository = {
  findSalon(salonId: string) {
    return prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true },
    });
  },

  hasCompletedBooking(customerId: string, salonId: string) {
    return prisma.booking.findFirst({
      where: {
        customerId,
        status: "COMPLETED",
        items: {
          some: {
            slot: {
              salonId,
            },
          },
        },
      },
      select: { id: true },
    });
  },

  upsertCustomerRating(customerId: string, salonId: string, rating: number) {
    return prisma.salonRating.upsert({
      where: {
        salonId_customerId: {
          salonId,
          customerId,
        },
      },
      create: {
        salonId,
        customerId,
        rating,
      },
      update: {
        rating,
      },
      select: {
        id: true,
        salonId: true,
        customerId: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findCustomerRating(customerId: string, salonId: string) {
    return prisma.salonRating.findUnique({
      where: {
        salonId_customerId: {
          salonId,
          customerId,
        },
      },
      select: {
        id: true,
        salonId: true,
        customerId: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
