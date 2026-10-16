import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";

export async function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User account not found",
        },
      });
      return;
    }

    if (user.role !== "OWNER") {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only salon owners can perform this action",
        },
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
