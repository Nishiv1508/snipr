import { api } from "@/lib/api";

export type UserRole = "CUSTOMER" | "OWNER";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  totpEnabled?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  setupRequired?: boolean;
  twoFactorRequired?: boolean;
}

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  secret: string;
}

export interface EnableTwoFactorResponse {
  user: AuthUser;
  recoveryCodes: string[];
}

export async function registerRequest(input: {
  email: string;
  password: string;
  role: UserRole;
}) {
  const response = await api.post("/auth/register", input);
  return (response.data.data ?? response.data) as AuthResponse;
}

export async function loginRequest(input: { email: string; password: string }) {
  const response = await api.post("/auth/login", input);
  return (response.data.data ?? response.data) as AuthResponse;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  const data = response.data.data ?? response.data;

  return (data.user ?? data) as AuthUser;
}

export async function setupTwoFactorRequest() {
  const response = await api.post("/auth/2fa/setup");
  return (response.data.data ?? response.data) as TwoFactorSetup;
}

export async function enableTwoFactorRequest(code: string) {
  const response = await api.post("/auth/2fa/enable", { code });
  return (response.data.data ?? response.data) as EnableTwoFactorResponse;
}

export async function verifyLoginTwoFactorRequest(
  input: { code: string } | { recoveryCode: string },
) {
  const response = await api.post("/auth/2fa/verify-login", input);
  return response.data.data ?? response.data;
}

export async function logoutRequest() {
  const response = await api.post("/auth/logout");
  return response.data.data ?? response.data;
}
