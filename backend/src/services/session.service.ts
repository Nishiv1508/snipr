import { env } from "../config/env";
import { sessionRepository } from "../repositories/session.repository";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "../utils/tokens";
import { AppError } from "../utils/appError";

export class SessionService {
  async issue(userId: string) {
    const refreshToken = createRefreshToken();

    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    await sessionRepository.create(
      userId,
      hashRefreshToken(refreshToken),
      expiresAt,
    );

    return {
      accessToken: createAccessToken(userId),
      refreshToken,
    };
  }

  async refresh(oldToken: string) {
    const oldHash = hashRefreshToken(oldToken);
    const session = await sessionRepository.findValid(oldHash);

    if (!session) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Please log in again");
    }

    const newToken = createRefreshToken();
    const newHash = hashRefreshToken(newToken);

    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    const rotated = await sessionRepository.rotate(
      session.id,
      session.userId,
      oldHash,
      newHash,
      expiresAt,
    );

    if (!rotated) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Please log in again");
    }

    return {
      accessToken: createAccessToken(session.userId),
      refreshToken: newToken,
    };
  }

  async revoke(refreshToken?: string) {
    if (refreshToken) {
      await sessionRepository.revoke(hashRefreshToken(refreshToken));
    }
  }

  async revokeAll(userId: string) {
    await sessionRepository.revokeAll(userId);
  }
}

export const sessionService = new SessionService();
