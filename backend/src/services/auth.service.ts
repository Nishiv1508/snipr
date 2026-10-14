import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { sessionService } from "./session.service";
import { AppError } from "../utils/appError";
import { UserRole } from "@prisma/client";
import { createTemporaryToken } from "../utils/tokens";

export class AuthService {
  async register(email: string, password: string, role: UserRole) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError(
        409,
        "EMAIL_ALREADY_REGISTERED",
        "Unable to register with this email address",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await userRepository.create(email, passwordHash, role);
      const tokens = await sessionService.issue(user.id);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      // Handle simultaneous registrations with the same email.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          409,
          "EMAIL_ALREADY_REGISTERED",
          "Unable to register with this email address",
        );
      }

      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password",
      );
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
    };

    // Owners must complete 2FA before receiving a full session.
    if (user.role === "OWNER") {
      if (!user.totpEnabled) {
        return {
          flow: "setup_required" as const,
          user: safeUser,
          temporaryToken: createTemporaryToken(user.id, "owner_2fa_setup"),
        };
      }

      if (!user.totpSecretEnc) {
        throw new AppError(
          500,
          "TWO_FACTOR_CONFIGURATION_ERROR",
          "Owner two-factor configuration requires recovery",
        );
      }

      return {
        flow: "two_factor_required" as const,
        user: safeUser,
        temporaryToken: createTemporaryToken(user.id, "owner_2fa_challenge"),
      };
    }

    // Customers and other non-owner roles use normal login.
    const tokens = await sessionService.issue(user.id);

    return {
      flow: "authenticated" as const,
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    return user;
  }
}

export const authService = new AuthService();
