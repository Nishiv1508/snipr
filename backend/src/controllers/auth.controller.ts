import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { authService } from "../services/auth.service";
import { twoFactorService } from "../services/twoFactor.service";
import { sessionService } from "../services/session.service";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SETUP_COOKIE,
  CHALLENGE_COOKIE,
  setAccessCookie,
  setRefreshCookie,
  setTemporaryCookie,
  clearAuthCookies,
} from "../utils/authCookies";
import { verifyToken } from "../utils/tokens";
import { AppError } from "../utils/appError";

function getTemporaryUserId(
  req: Request,
  cookieName: typeof SETUP_COOKIE | typeof CHALLENGE_COOKIE,
  purpose: "owner_2fa_setup" | "owner_2fa_challenge",
): string {
  const token = req.cookies?.[cookieName];

  if (!token) {
    throw new AppError(
      401,
      "TWO_FACTOR_CHALLENGE_REQUIRED",
      "Please log in again to continue",
    );
  }

  try {
    return verifyToken(token, purpose);
  } catch {
    throw new AppError(
      401,
      "INVALID_TWO_FACTOR_CHALLENGE",
      "Your authentication challenge has expired. Please log in again",
    );
  }
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register(email, password, role);

      clearAuthCookies(res);
      setAccessCookie(res, result.accessToken);
      setRefreshCookie(res, result.refreshToken);

      res.status(201).json({
        message: "Registration successful",
        data: { user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Clear any stale authentication or challenge cookies first.
      clearAuthCookies(res);

      if (result.flow === "setup_required") {
        setTemporaryCookie(
          res,
          SETUP_COOKIE,
          result.temporaryToken,
          10 * 60 * 1000,
        );

        res.status(200).json({
          message: "Authenticator setup required",
          data: {
            user: result.user,
            twoFactorRequired: true,
            setupRequired: true,
          },
        });
        return;
      }

      if (result.flow === "two_factor_required") {
        setTemporaryCookie(
          res,
          CHALLENGE_COOKIE,
          result.temporaryToken,
          5 * 60 * 1000,
        );

        res.status(200).json({
          message: "Authenticator verification required",
          data: {
            user: result.user,
            twoFactorRequired: true,
            setupRequired: false,
          },
        });
        return;
      }

      setAccessCookie(res, result.accessToken);
      setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        message: "Login successful",
        data: { user: result.user },
      });
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getTemporaryUserId(req, SETUP_COOKIE, "owner_2fa_setup");

      const result = await twoFactorService.setup(userId);

      res.status(200).json({
        message: "Scan the QR code using Microsoft Authenticator",
        data: {
          qrCodeDataUrl: result.qrCodeDataUrl,
          secret: result.secret,
          issuer: "Snipr",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getTemporaryUserId(req, SETUP_COOKIE, "owner_2fa_setup");

      const { code } = req.body;

      const result = await twoFactorService.enable(userId, code);
      const tokens = await sessionService.issue(userId);

      // Replace the temporary setup cookie with a full session.
      clearAuthCookies(res);
      setAccessCookie(res, tokens.accessToken);
      setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        message: "Two-factor authentication enabled successfully",
        data: {
          user: result.user,
          recoveryCodes: result.recoveryCodes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyLogin2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getTemporaryUserId(
        req,
        CHALLENGE_COOKIE,
        "owner_2fa_challenge",
      );

      const { code, recoveryCode } = req.body;

      const user = await twoFactorService.verifyLogin(
        userId,
        code,
        recoveryCode,
      );

      const tokens = await sessionService.issue(user.id);

      clearAuthCookies(res);
      setAccessCookie(res, tokens.accessToken);
      setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        message: "Login successful",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
      }

      const { password, code } = req.body;

      await twoFactorService.disable(req.userId, password, code);

      // Invalidate every existing session for this owner.
      await sessionService.revokeAll(req.userId);
      clearAuthCookies(res);

      res.status(200).json({
        message:
          "Two-factor authentication disabled. Please log in and set it up again to continue as an owner.",
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      if (!refreshToken) {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Please log in again");
      }

      const tokens = await sessionService.refresh(refreshToken);

      setAccessCookie(res, tokens.accessToken);
      setRefreshCookie(res, tokens.refreshToken);

      res.status(200).json({
        message: "Session refreshed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      await sessionService.revoke(refreshToken);
      clearAuthCookies(res);

      res.status(200).json({
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.userId!);

      res.status(200).json({
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
