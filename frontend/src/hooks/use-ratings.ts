"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMySalonRating,
  submitSalonRating,
  type SubmitSalonRatingInput,
} from "@/lib/api/rating.api";
import { publicSalonKeys } from "@/hooks/use-salons";

export const ratingKeys = {
  all: ["ratings"] as const,
  mine: (salonId: string) => [...ratingKeys.all, "mine", salonId] as const,
};

export function useMySalonRating(salonId: string) {
  return useQuery({
    queryKey: ratingKeys.mine(salonId),
    queryFn: () => getMySalonRating(salonId),
    enabled: Boolean(salonId),
  });
}

export function useSubmitSalonRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitSalonRatingInput) => submitSalonRating(input),
    onSuccess: async (_rating, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ratingKeys.mine(variables.salonId),
        }),
        queryClient.invalidateQueries({
          queryKey: publicSalonKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: publicSalonKeys.detail(variables.salonId),
        }),
      ]);
    },
  });
}
