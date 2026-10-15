import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Use a separate Axios instance so the refresh request cannot
// trigger the api response interceptor recursively.
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;

  const path = url.split("?")[0].replace(/\/+$/, "");

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/2fa/setup",
    "/auth/2fa/enable",
    "/auth/2fa/verify-login",
  ].some((route) => path.endsWith(route));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });
      }

      await refreshPromise;

      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;

      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    }
  },
);

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }

    // Handle errors shaped like { error: { code, message } }
    if (
      data?.error &&
      typeof data.error === "object" &&
      typeof data.error.message === "string"
    ) {
      return data.error.message;
    }

    // Handle errors shaped like { code, message }
    if (typeof data?.message === "object" && data.message !== null) {
      const message = data.message as { message?: unknown };

      if (typeof message.message === "string") {
        return message.message;
      }
    }

    return "Unable to complete your request. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
