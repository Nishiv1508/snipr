import { UserRole } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { salonRepository } from "../repositories/salon.repository";
import { AppError } from "../utils/appError";
import type { CreateSalonInput } from "../validators/salon.validator";

export class SalonService {
  private async assertOwner(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    if (user.role !== UserRole.OWNER) {
      throw new AppError(403, "OWNER_ONLY", "Only salon owner accounts can manage salons");
    }

    if (!user.totpEnabled) {
      throw new AppError(
        403,
        "OWNER_TWO_FACTOR_REQUIRED",
        "Complete authenticator two-factor setup before registering a salon",
      );
    }
  }

  async create(userId: string, input: CreateSalonInput) {
    await this.assertOwner(userId);
    return salonRepository.create(userId, input);
  }

  async listForOwner(userId: string) {
    await this.assertOwner(userId);
    return salonRepository.findByOwner(userId);
  }
}

export const salonService = new SalonService();
