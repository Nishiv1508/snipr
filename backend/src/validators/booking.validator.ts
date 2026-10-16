import { z } from "zod";

const uuidSchema = z.string().uuid();

export const availableSlotsSchema = z.object({
  body: z.record(z.string(), z.unknown()).default({}),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    slotId: uuidSchema,
    serviceIds: z
      .array(uuidSchema)
      .min(1, "Select at least one service")
      .max(10, "You can select a maximum of 10 services")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Duplicate services are not allowed",
      ),
  }),
  params: z.record(z.string(), z.unknown()).optional(),
  query: z.record(z.string(), z.unknown()).optional(),
});

export const bookingIdSchema = z.object({
  body: z.record(z.string(), z.unknown()).default({}),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});

export const verifyTicketSchema = z.object({
  body: z.object({
    key: z.string().min(16).max(256),
  }),
  params: z.object({
    id: uuidSchema,
  }),
  query: z.record(z.string(), z.unknown()).optional(),
});
