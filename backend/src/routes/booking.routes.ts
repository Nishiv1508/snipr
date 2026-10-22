import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireCustomer } from "../middlewares/requireCustomer";
import { requireOwner } from "../middlewares/requireOwner";
import { validate } from "../middlewares/validate";
import {
  createBookingSchema,
  bookingIdSchema,
  verifyTicketSchema,
  ownerBookingsQuerySchema,
} from "../validators/booking.validator";
import {
  createBooking,
  listMyBookings,
  downloadTicket,
  cancelBooking,
  listOwnerBookings,
  verifyTicket,
} from "../controllers/booking.controller";

const customerRouter = Router();

customerRouter.use(authenticate, requireCustomer);

customerRouter.post("/", validate(createBookingSchema), createBooking);

customerRouter.get("/me", listMyBookings);

customerRouter.get("/:id/ticket", validate(bookingIdSchema), downloadTicket);

customerRouter.post("/:id/cancel", validate(bookingIdSchema), cancelBooking);

const ownerRouter = Router();

ownerRouter.use(authenticate, requireOwner);

ownerRouter.get(
  "/bookings",
  validate(ownerBookingsQuerySchema),
  listOwnerBookings,
);

ownerRouter.post(
  "/bookings/:id/verify",
  validate(verifyTicketSchema),
  verifyTicket,
);

export { customerRouter, ownerRouter };
