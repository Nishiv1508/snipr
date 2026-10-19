import { z } from "zod";

const uuidSchema = z.string().uuid();

export const submitRatingSchema = z.object({
  body: z
    .object({
      salonId: uuidSchema,
      rating: z
        .number()
        .int("Rating must be a whole number")
        .min(1, "Rating must be at least 1")
        .max(5, "Rating cannot exceed 5"),
    })
    .strict(),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
});

export const getMyRatingSchema = z.object({
  body: z.record(z.string(), z.unknown()).default({}),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.object({
    salonId: uuidSchema,
  }),
});
