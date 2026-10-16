import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/tokens";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.snipr_access;

  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  try {
    const userId = verifyToken(token, "access");

    req.userId = userId;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired authentication token",
      },
    });
  }
}
