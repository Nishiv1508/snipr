"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSalon,
  getMySalons,
  getSalonById,
  publishSalon,
  unpublishSalon,
  updateSalon,
  type CreateSalonInput,
  type UpdateSalonInput,
} from "@/lib/api/salon.api";

export const salonKeys = {
  all: ["salons"] as const,
  mine: () => [...salonKeys.all, "mine"] as const,
  detail: (id: string) => [...salonKeys.all, "detail", id] as const,
};

export function useMySalons() {
  return useQuery({
    queryKey: salonKeys.mine(),
    queryFn: getMySalons,
  });
}

export function useSalon(id: string) {
  return useQuery({
    queryKey: salonKeys.detail(id),
    queryFn: () => getSalonById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSalonInput) => createSalon(input),
    onSuccess: async (salon) => {
      await queryClient.invalidateQueries({
        queryKey: salonKeys.mine(),
      });

      if (salon?.id) {
        queryClient.setQueryData(salonKeys.detail(salon.id), salon);
      }
    },
  });
}

export function useUpdateSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSalonInput }) =>
      updateSalon(id, input),
    onSuccess: async (salon) => {
      await queryClient.invalidateQueries({
        queryKey: salonKeys.mine(),
      });

      if (salon?.id) {
        queryClient.invalidateQueries({
          queryKey: salonKeys.detail(salon.id),
        });
      }
    },
  });
}

export function usePublishSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishSalon,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: salonKeys.mine(),
      });
    },
  });
}

export function useUnpublishSalon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unpublishSalon,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: salonKeys.mine(),
      });
    },
  });
}
