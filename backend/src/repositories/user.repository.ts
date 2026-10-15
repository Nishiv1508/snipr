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
  async create(email: string, passwordHash: string, role: UserRole) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
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

  async findSecurityById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        totpSecretEnc: true,
        totpEnabled: true,
        recoveryCodesHash: true,
      },
    });
  }

  async saveTotpSecret(userId: string, encryptedSecret: string) {
    return prisma.user.updateMany({
      where: {
        id: userId,
        role: UserRole.OWNER,
        totpEnabled: false,
      },
      data: {
        totpSecretEnc: encryptedSecret,
      },
    });
  }

  async enableTotp(
    userId: string,
    encryptedSecret: string,
    recoveryCodesHash: string[],
  ) {
    return prisma.user.updateMany({
      where: {
        id: userId,
        role: UserRole.OWNER,
        totpEnabled: false,
        totpSecretEnc: encryptedSecret,
      },
      data: {
        totpEnabled: true,
        recoveryCodesHash,
      },
    });
  }

  async disableTotp(userId: string) {
    return prisma.user.updateMany({
      where: {
        id: userId,
        role: UserRole.OWNER,
        totpEnabled: true,
      },
      data: {
        totpEnabled: false,
        totpSecretEnc: null,
        recoveryCodesHash: [],
      },
    });
  }

  async consumeRecoveryCode(
    userId: string,
    codeHash: string,
  ): Promise<boolean> {
    // Remove the code atomically so concurrent requests cannot reuse it.
    const updated = await prisma.$executeRaw`
    UPDATE "users"
    SET "recovery_codes_hash" =
      array_remove("recovery_codes_hash", ${codeHash})
    WHERE "id" = ${userId}::uuid
      AND "role" = 'OWNER'
      AND "totp_enabled" = true
      AND "recovery_codes_hash" @> ARRAY[${codeHash}]::text[]
  `;

    return updated === 1;
  }
}

export const userRepository = new UserRepository();
