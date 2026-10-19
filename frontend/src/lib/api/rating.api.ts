import { api } from "@/lib/api";

export interface SalonRating {
  id: string;
  salonId: string;
  customerId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSalonRatingInput {
  salonId: string;
  rating: number;
}

function unwrapRating(data: unknown): SalonRating | null {
  if (!data || typeof data !== "object") return null;

  const result = data as Record<string, unknown>;
  const value = "data" in result ? result.data : result;

  if (!value || typeof value !== "object") return null;
  return value as SalonRating;
}

/** Create or update the authenticated customer's rating for a salon. */
export async function submitSalonRating(
  input: SubmitSalonRatingInput,
): Promise<SalonRating> {
  const response = await api.post<{ data: SalonRating }>("/ratings", input);

  return response.data.data;
}

/** Get the authenticated customer's rating for a salon, or null if not rated yet. */
export async function getMySalonRating(
  salonId: string,
): Promise<SalonRating | null> {
  const response = await api.get<{ data: SalonRating | null }>("/ratings/me", {
    params: { salonId },
  });

  return unwrapRating(response.data);
}
