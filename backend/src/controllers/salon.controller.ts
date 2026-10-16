import { Request, Response, NextFunction } from "express";
import { salonService } from "../services/salon.service";
import { AppError } from "../utils/appError";

function ownerId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return req.userId;
}

function getSalonId(req: Request): string {
  const id = req.params.id;

  if (typeof id !== "string") {
    throw new AppError(400, "INVALID_SALON_ID", "Invalid salon ID");
  }

  return id;
}

export async function createSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.create(ownerId(req), req.body);
    res.status(201).json({ data: salon });
  } catch (error) {
    next(error);
  }
}

export async function getMySalons(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salons = await salonService.listMine(ownerId(req));
    res.json({ data: salons });
  } catch (error) {
    next(error);
  }
}

export async function getSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.getMine(ownerId(req), getSalonId(req));
    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}

export async function updateSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.update(
      ownerId(req),
      getSalonId(req),
      req.body,
    );
    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}

export async function publishSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.publish(ownerId(req), getSalonId(req));
    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}

export async function unpublishSalon(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.unpublish(ownerId(req), getSalonId(req));
    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}

export async function updateSalonCapacity(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const salon = await salonService.updateCapacity(
      ownerId(req),
      getSalonId(req),
      req.body.defaultBookingCapacity,
    );

    res.json({ data: salon });
  } catch (error) {
    next(error);
  }
}
