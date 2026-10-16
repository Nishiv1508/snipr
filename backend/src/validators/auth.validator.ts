import { z } from "zod";

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().max(254),
      password: z.string().min(8).max(72),
      role: z.enum(["CUSTOMER", "OWNER"]),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((v) => v.toLowerCase()),
      password: z.string().min(1).max(72),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
