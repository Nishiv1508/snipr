import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { signAuthToken } from "../utils/jwt";
import { AppError } from "../utils/appError";

export class AuthService {
  async register(email: string, password: string) {
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
      const user = await userRepository.create(email, passwordHash);
      const token = signAuthToken(user.id);

      return { user, token };
    } catch (error) {
      // Protect against two simultaneous registrations for the same email.
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

    // Use the same response for unknown emails and incorrect passwords.
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

    if (user.totpEnabled) {
      // We will implement this flow in the 2FA phase.
      throw new AppError(
        501,
        "TWO_FACTOR_NOT_IMPLEMENTED",
        "Two-factor login is not implemented yet",
      );
    }

    const {
      passwordHash: _,
      totpSecretEnc: __,
      recoveryCodesHash: ___,
      ...safeUser
    } = user;

    return {
      user: safeUser,
      token: signAuthToken(user.id),
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
