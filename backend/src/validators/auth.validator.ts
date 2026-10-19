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

export const enable2FASchema = z.object({
  body: z.object({
    code: z.string().regex(/^\d{6}$/, "Enter a valid six-digit code"),
  }),
});

export const verifyLogin2FASchema = z.object({
  body: z
    .object({
      code: z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
      recoveryCode: z.string().trim().min(1).max(32).optional(),
    })
    .refine(
      (data) => Boolean(data.code) !== Boolean(data.recoveryCode),
      "Provide either an authenticator code or a recovery code",
    ),
});

export const disable2FASchema = z.object({
  body: z.object({
    password: z.string().min(1),
    code: z.string().regex(/^\d{6}$/),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
