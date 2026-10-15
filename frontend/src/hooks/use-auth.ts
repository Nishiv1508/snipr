"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  enableTwoFactorRequest,
  getCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  setupTwoFactorRequest,
  verifyLoginTwoFactorRequest,
  type UserRole,
} from "@/lib/api/auth.api";

export const authKeys = {
  all: ["auth"] as const,
  currentUser: ["auth", "me"] as const,
};

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: getCurrentUser,
    enabled,
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (result) => {
      if (!result.setupRequired && !result.twoFactorRequired) {
        queryClient.setQueryData(authKeys.currentUser, result.user);
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (result) => {
      if (!result.setupRequired && !result.twoFactorRequired) {
        queryClient.setQueryData(authKeys.currentUser, result.user);
      }
    },
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: setupTwoFactorRequest,
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableTwoFactorRequest,
    onSuccess: (result) => {
      queryClient.setQueryData(authKeys.currentUser, result.user);
    },
  });
}

export function useVerifyLoginTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyLoginTwoFactorRequest,
    onSuccess: () => {
      // Fetch the authoritative profile after the server establishes
      // the authenticated session.
      queryClient.invalidateQueries({
        queryKey: authKeys.currentUser,
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      queryClient.clear();
    },
  });
}

export type { UserRole };
