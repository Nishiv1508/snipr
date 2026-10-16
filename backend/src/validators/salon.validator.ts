import { z } from "zod";

const uuidSchema = z.string().uuid();

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  durationMin: z.number().int().min(5).max(1440),
  price: z.number().min(0).max(99999999.99),
  isActive: z.boolean().optional(),
});

const hoursSchema = z
  .object({
    day: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    isClosed: z.boolean(),
    opensAt: timeSchema.nullable().optional(),
    closesAt: timeSchema.nullable().optional(),
  })
  .superRefine((hours, ctx) => {
    if (hours.isClosed) return;

    if (!hours.opensAt || !hours.closesAt) {
      ctx.addIssue({
        code: "custom",
        message: "Opening and closing times are required for open days",
      });
      return;
    }

    if (hours.opensAt >= hours.closesAt) {
      ctx.addIssue({
        code: "custom",
        message: "Closing time must be later than opening time",
      });
    }
  });

const salonFields = {
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).nullable().optional(),
  imageUrl: z
    .string()
    .url()
    .max(2048)
    .nullable()
    .optional()
    .refine(
      (value) =>
        !value || ["http:", "https:"].includes(new URL(value).protocol),
      "Image URL must use HTTP or HTTPS",
    ),
  address: z.string().trim().min(5).max(2000),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  googleMapsUrl: z
    .string()
    .url()
    .max(2048)
    .nullable()
    .optional()
    .refine(
      (value) =>
        !value || ["http:", "https:"].includes(new URL(value).protocol),
      "Google Maps URL must use HTTP or HTTPS",
    ),
};

export const createSalonSchema = z.object({
  body: z.object({
    ...salonFields,
    services: z.array(serviceSchema).max(100).optional().default([]),
    hours: z.array(hoursSchema).length(7).optional().default([]),
  }),
});

export const updateSalonSchema = z.object({
  body: z
    .object({
      ...Object.fromEntries(
        Object.entries(salonFields).map(([key, schema]) => [
          key,
          schema.optional(),
        ]),
      ),
      services: z.array(serviceSchema).max(100).optional(),
      hours: z.array(hoursSchema).length(7).optional(),
    })
    .strict()
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one field to update",
    ),
});

export const salonIdSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.record(z.string(), z.unknown()),
});

export const updateSalonRequestSchema = z.object({
  body: updateSalonSchema.shape.body,
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});

export const updateSalonCapacitySchema = z.object({
  body: z.object({
    defaultBookingCapacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(500, "Capacity cannot exceed 500"),
  }),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});
