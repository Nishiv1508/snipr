import crypto from "node:crypto";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { env } from "../config/env";

const ISSUER = "Snipr";
const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = Buffer.from(env.TOTP_ENCRYPTION_KEY, "hex");

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("TOTP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
}

// Allow a code from the previous or next 30-second time step.
authenticator.options = {
  ...authenticator.options,
  step: 30,
  digits: 6,
  window: 1,
};

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function generateOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function generateTotpQrCode(
  email: string,
  secret: string,
): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
  const otpauthUrl = generateOtpAuthUrl(email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { otpauthUrl, qrCodeDataUrl };
}

export function encryptTotpSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Versioned format: v1:IV:AUTH_TAG:CIPHERTEXT
  return [
    "v1",
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptTotpSecret(encryptedSecret: string): string {
  const [version, ivHex, authTagHex, ciphertextHex] =
    encryptedSecret.split(":");

  if (version !== "v1" || !ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted TOTP secret format");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function verifyTotpCode(code: string, secret: string): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  return authenticator.check(code, secret);
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(6).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  });
}

export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/-/g, "").toUpperCase();

  return crypto.createHash("sha256").update(normalized).digest("hex");
}
