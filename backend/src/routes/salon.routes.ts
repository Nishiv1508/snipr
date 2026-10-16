import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireOwner } from "../middlewares/requireOwner";
import { validate } from "../middlewares/validate";
import {
  createSalonSchema,
  updateSalonCapacitySchema,
  salonIdSchema,
  updateSalonRequestSchema,
} from "../validators/salon.validator";
import {
  createSalon,
  getMySalons,
  getSalon,
  updateSalon,
  publishSalon,
  unpublishSalon,
  updateSalonCapacity,
} from "../controllers/salon.controller";

const router = Router();

router.use(authenticate, requireOwner);

router.post("/", validate(createSalonSchema), createSalon);
router.get("/mine", getMySalons);
router.get("/:id", validate(salonIdSchema), getSalon);
router.patch("/:id", validate(updateSalonRequestSchema), updateSalon);
router.post("/:id/publish", validate(salonIdSchema), publishSalon);
router.post("/:id/unpublish", validate(salonIdSchema), unpublishSalon);
router.patch(
  "/:id/capacity",
  validate(updateSalonCapacitySchema),
  updateSalonCapacity,
);

export default router;
