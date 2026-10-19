import { Response } from "express";
import { env } from "../config/env";

export const ACCESS_COOKIE = "snipr_access";
export const REFRESH_COOKIE = "snipr_refresh";
export const SETUP_COOKIE = "snipr_2fa_setup";
export const CHALLENGE_COOKIE = "snipr_2fa_challenge";

const baseOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite:
    env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function setTemporaryCookie(
  res: Response,
  name: typeof SETUP_COOKIE | typeof CHALLENGE_COOKIE,
  token: string,
  maxAge: number,
) {
  res.cookie(name, token, { ...baseOptions, maxAge });
}

export function clearAuthCookies(res: Response) {
  for (const name of [
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    SETUP_COOKIE,
    CHALLENGE_COOKIE,
  ]) {
    res.clearCookie(name, baseOptions);
  }
}
