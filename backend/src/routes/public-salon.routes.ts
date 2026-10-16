import { Router } from "express";
import {
  listPublicSalons,
  getPublicSalon,
} from "../controllers/public-salon.controller";
import { validate } from "../middlewares/validate";
import { salonIdSchema } from "../validators/salon.validator";
import { getAvailableSlots } from "../controllers/booking.controller";
import { availableSlotsSchema } from "../validators/booking.validator";

const router = Router();

router.get("/", listPublicSalons);
router.get("/:id", validate(salonIdSchema), getPublicSalon);
router.get("/:id/slots", validate(availableSlotsSchema), getAvailableSlots);

export default router;
