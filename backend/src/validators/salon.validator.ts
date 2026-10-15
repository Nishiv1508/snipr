import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const createSalonSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20).regex(/^[+()\d\s.-]+$/, "Enter a valid phone number"),
    description: optionalTrimmed(1000),
    addressLine1: z.string().trim().min(3).max(200),
    addressLine2: optionalTrimmed(200),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(12).regex(/^[a-zA-Z0-9 -]+$/, "Enter a valid postal code"),
    country: z.string().trim().min(2).max(80).default("India"),
  }).strict(),
});

export type CreateSalonInput = z.infer<typeof createSalonSchema>["body"];
