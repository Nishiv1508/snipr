"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSalon, listMySalons } from "@/lib/api/salon.api";
export const salonKeys = { all: ["salons"] as const, mine: ["salons", "mine"] as const };
export function useMySalons() {
  return useQuery({ queryKey: salonKeys.mine, queryFn: listMySalons });
}
export function useCreateSalon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSalon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: salonKeys.mine }),
  });
}
