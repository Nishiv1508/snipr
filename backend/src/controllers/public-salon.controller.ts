import { Request, Response, NextFunction } from "express";
import { salonService } from "../services/salon.service";
import { AppError } from "../utils/appError";

export async function listPublicSalons(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const city =
      typeof req.query.city === "string" ? req.query.city : undefined;

    const salons = await salonService.listPublic(city);
    res.json({ data: salons });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new AppError(400, "INVALID_SALON_ID", "Invalid salon ID");
    }
    const salon = await salonService.getPublic(id);
    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}
