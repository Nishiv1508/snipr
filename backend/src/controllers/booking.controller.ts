import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service";
import { AppError } from "../utils/appError";

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  return req.userId;
}

function requireParam(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "INVALID_PARAMETER", "Invalid route parameter");
  }

  return value;
}

export async function getAvailableSlots(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const salonId = requireParam(req.params.id);
    const date = req.query.date;

    if (!salonId || typeof date !== "string") {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "A salon ID and date query parameter are required",
      );
    }

    const result = await bookingService.getAvailableSlots(salonId, date);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const booking = await bookingService.createBooking(req.userId!, {
      slotId: req.body.slotId,
      serviceIds: req.body.serviceIds,
    });

    res.status(201).json({
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bookings = await bookingService.listMyBookings(requireUserId(req));
    res.status(200).json({ data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function downloadTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await bookingService.downloadTicket(
      requireUserId(req),
      requireParam(req.params.id),
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="snipr-ticket-${result.reference}.pdf"`,
    );
    res.setHeader("Content-Length", result.buffer.length);
    res.status(200).send(result.buffer);
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await bookingService.cancelBooking(
      requireUserId(req),
      requireParam(req.params.id),
    );

    res.status(200).json({
      message: result.alreadyCancelled
        ? "Booking was already cancelled"
        : "Booking cancelled successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listOwnerBookings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bookings = await bookingService.listOwnerBookings(requireUserId(req));

    res.status(200).json({ data: bookings });
  } catch (error) {
    next(error);
  }
}

export async function verifyTicket(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await bookingService.verifyTicket(
      requireUserId(req),
      requireParam(req.params.id),
      req.body.key,
    );

    res.status(200).json({
      message: "Ticket verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
