import { RequestHandler } from "express";
import { z } from "zod";

type RequestSchema = z.ZodType<{
  body: Record<string, unknown>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}>;

export function validate<T extends RequestSchema>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body ?? {},
      params: req.params,
      query: req.query ?? {},
    });

    if (!result.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: result.error.flatten(),
        },
      });
      return;
    }

    req.body = result.data.body;
    next();
  };
}
