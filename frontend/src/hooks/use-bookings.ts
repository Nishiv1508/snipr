"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelBooking,
  createBooking,
  downloadBookingTicket,
  getAvailableSlots,
  getMyBookings,
  getOwnerBookings,
  verifyBookingTicket,
  type CreateBookingInput,
  type VerifyTicketInput,
} from "@/lib/api/booking.api";

export const bookingKeys = {
  all: ["bookings"] as const,

  mine: () => [...bookingKeys.all, "mine"] as const,

  owner: (date?: string) =>
    [...bookingKeys.all, "owner", date ?? "all"] as const,

  slots: (salonId: string, date: string) =>
    [...bookingKeys.all, "slots", salonId, date] as const,
};

// ---------- Queries ----------

export function useAvailableSlots(salonId: string, date: string) {
  return useQuery({
    queryKey: bookingKeys.slots(salonId, date),
    queryFn: () => getAvailableSlots(salonId, date),
    enabled: Boolean(salonId && date),
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: getMyBookings,
  });
}

export function useOwnerBookings(date?: string) {
  return useQuery({
    queryKey: bookingKeys.owner(date),
    queryFn: () => getOwnerBookings(date),
  });
}

// ---------- Mutations ----------

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.mine(),
        }),
        queryClient.invalidateQueries({
          queryKey: [...bookingKeys.all, "slots"],
        }),
        queryClient.invalidateQueries({
          queryKey: [...bookingKeys.all, "owner"],
        }),
      ]);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.mine(),
        }),
        queryClient.invalidateQueries({
          queryKey: [...bookingKeys.all, "slots"],
        }),
        queryClient.invalidateQueries({
          queryKey: [...bookingKeys.all, "owner"],
        }),
      ]);
    },
  });
}

export function useDownloadBookingTicket() {
  return useMutation({
    mutationFn: (bookingId: string) => downloadBookingTicket(bookingId),

    onSuccess: (blob, bookingId) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `snipr-ticket-${bookingId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}

export function useVerifyBookingTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      input,
    }: {
      bookingId: string;
      input: VerifyTicketInput;
    }) => verifyBookingTicket(bookingId, input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...bookingKeys.all, "owner"],
      });
    },
  });
}
