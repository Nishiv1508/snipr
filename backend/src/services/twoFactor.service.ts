import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";

import { userRepository } from "../repositories/user.repository";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpQrCode,
  generateTotpSecret,
  hashRecoveryCode,
  verifyTotpCode,
} from "../utils/totp";
import { AppError } from "../utils/appError";

export class TwoFactorService {
  private async getOwnerSecurity(userId: string) {
    const user = await userRepository.findSecurityById(userId);

    if (!user || user.role !== UserRole.OWNER) {
      throw new AppError(403, "OWNER_REQUIRED", "Owner account required");
    }

    return user;
  }

  async setup(userId: string) {
    const user = await this.getOwnerSecurity(userId);

    if (user.totpEnabled) {
      throw new AppError(
        409,
        "TWO_FACTOR_ALREADY_ENABLED",
        "Two-factor authentication is already enabled",
      );
    }

    const secret = generateTotpSecret();
    const encryptedSecret = encryptTotpSecret(secret);

    const saved = await userRepository.saveTotpSecret(userId, encryptedSecret);

    if (saved.count !== 1) {
      throw new AppError(
        409,
        "TWO_FACTOR_SETUP_CONFLICT",
        "Unable to start two-factor setup. Please try again",
      );
    }

    const qr = await generateTotpQrCode(user.email, secret);

    // The secret is returned only during setup so the owner can
    // manually enter it if scanning the QR code is unavailable.
    return {
      qrCodeDataUrl: qr.qrCodeDataUrl,
      secret,
    };
  }

  async enable(userId: string, code: string) {
    const user = await this.getOwnerSecurity(userId);

    if (user.totpEnabled) {
      throw new AppError(
        409,
        "TWO_FACTOR_ALREADY_ENABLED",
        "Two-factor authentication is already enabled",
      );
    }

    if (!user.totpSecretEnc) {
      throw new AppError(
        400,
        "TWO_FACTOR_SETUP_REQUIRED",
        "Start two-factor setup before enabling it",
      );
    }

    let secret: string;

    try {
      secret = decryptTotpSecret(user.totpSecretEnc);
    } catch {
      throw new AppError(
        500,
        "TWO_FACTOR_SECRET_ERROR",
        "Unable to verify authenticator setup",
      );
    }

    if (!verifyTotpCode(code, secret)) {
      throw new AppError(
        400,
        "INVALID_AUTHENTICATOR_CODE",
        "Invalid or expired authenticator code",
      );
    }

    const recoveryCodes = generateRecoveryCodes();
    const recoveryHashes = recoveryCodes.map(hashRecoveryCode);

    const enabled = await userRepository.enableTotp(
      userId,
      user.totpSecretEnc,
      recoveryHashes,
    );

    if (enabled.count !== 1) {
      throw new AppError(
        409,
        "TWO_FACTOR_SETUP_CONFLICT",
        "Unable to enable two-factor authentication. Please try again",
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        totpEnabled: true,
      },
      recoveryCodes,
    };
  }

  async verifyLogin(userId: string, code?: string, recoveryCode?: string) {
    const user = await this.getOwnerSecurity(userId);

    if (!user.totpEnabled || !user.totpSecretEnc) {
      throw new AppError(
        401,
        "TWO_FACTOR_NOT_ENABLED",
        "Two-factor authentication must be set up",
      );
    }

    if (recoveryCode) {
      const consumed = await userRepository.consumeRecoveryCode(
        userId,
        hashRecoveryCode(recoveryCode),
      );

      if (!consumed) {
        throw new AppError(
          401,
          "INVALID_TWO_FACTOR_CODE",
          "Invalid authenticator or recovery code",
        );
      }
    } else {
      if (!code) {
        throw new AppError(
          400,
          "TWO_FACTOR_CODE_REQUIRED",
          "Enter your authenticator code",
        );
      }

      let secret: string;

      try {
        secret = decryptTotpSecret(user.totpSecretEnc);
      } catch {
        throw new AppError(
          500,
          "TWO_FACTOR_SECRET_ERROR",
          "Unable to verify authenticator code",
        );
      }

      if (!verifyTotpCode(code, secret)) {
        throw new AppError(
          401,
          "INVALID_TWO_FACTOR_CODE",
          "Invalid authenticator or recovery code",
        );
      }
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
    };
  }

  async disable(userId: string, password: string, code: string) {
    const user = await this.getOwnerSecurity(userId);

    if (!user.totpEnabled || !user.totpSecretEnc) {
      throw new AppError(
        400,
        "TWO_FACTOR_NOT_ENABLED",
        "Two-factor authentication is not enabled",
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid password or authenticator code",
      );
    }

    let secret: string;

    try {
      secret = decryptTotpSecret(user.totpSecretEnc);
    } catch {
      throw new AppError(
        500,
        "TWO_FACTOR_SECRET_ERROR",
        "Unable to verify authenticator code",
      );
    }

    if (!verifyTotpCode(code, secret)) {
      throw new AppError(
        401,
        "INVALID_TWO_FACTOR_CODE",
        "Invalid password or authenticator code",
      );
    }

    const disabled = await userRepository.disableTotp(userId);

    if (disabled.count !== 1) {
      throw new AppError(
        409,
        "TWO_FACTOR_STATE_CONFLICT",
        "Unable to disable two-factor authentication",
      );
    }

    return { success: true };
  }
}

export const twoFactorService = new TwoFactorService();
