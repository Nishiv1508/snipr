import crypto from "node:crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export function createAccessToken(userId: string): string {
  return jwt.sign({ userId, purpose: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function createTemporaryToken(
  userId: string,
  purpose: "owner_2fa_setup" | "owner_2fa_challenge",
): string {
  return jwt.sign({ userId, purpose }, env.JWT_SECRET, {
    expiresIn: purpose === "owner_2fa_setup" ? "10m" : "5m",
  });
}

export function verifyToken(
  token: string,
  expectedPurpose: "access" | "owner_2fa_setup" | "owner_2fa_challenge",
): string {
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof payload === "string" ||
    payload.purpose !== expectedPurpose ||
    typeof payload.userId !== "string"
  ) {
    throw new Error("Invalid token");
  }

  return payload.userId;
}

export function createRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
