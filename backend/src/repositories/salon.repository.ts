import { prisma } from "../config/db";
import type { CreateSalonInput } from "../validators/salon.validator";

export class SalonRepository {
  async create(ownerId: string, input: CreateSalonInput) {
    return prisma.salon.create({
      data: {
        ownerId,
        name: input.name,
        phone: input.phone,
        description: input.description,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
      },
    });
  }

  async findByOwner(ownerId: string) {
    return prisma.salon.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdForOwner(id: string, ownerId: string) {
    return prisma.salon.findFirst({
      where: { id, ownerId },
    });
  }
}

export const salonRepository = new SalonRepository();
