import { Request, Response, NextFunction } from "express";
import { ratingService } from "../services/rating.service";
import { AppError } from "../utils/appError";

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return req.userId;
}

function requireSalonId(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "INVALID_SALON_ID", "Invalid salon ID");
  }

  return value;
}

export async function submitRating(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await ratingService.submitRating(
      requireUserId(req),
      req.body.salonId,
      req.body.rating,
    );

    res.status(200).json({
      message: "Rating submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyRating(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await ratingService.getMyRating(
      requireUserId(req),
      requireSalonId(
        typeof req.query.salonId === "string" ? req.query.salonId : undefined,
      ),
    );

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}
