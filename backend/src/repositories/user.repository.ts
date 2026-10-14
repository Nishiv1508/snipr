import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/db";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  totpEnabled: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export class UserRepository {
  async create(email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
      },
      select: publicUserSelect,
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }
}

export const userRepository = new UserRepository();
