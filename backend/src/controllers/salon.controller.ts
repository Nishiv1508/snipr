import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { salonService } from "../services/salon.service";

export class SalonController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
      }

      const salon = await salonService.create(req.userId, req.body);
      res.status(201).json({
        message: "Salon registered successfully",
        data: { salon },
      });
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "UNAUTHORIZED", "Authentication required");
      }

      const salons = await salonService.listForOwner(req.userId);
      res.status(200).json({
        data: { salons },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const salonController = new SalonController();
