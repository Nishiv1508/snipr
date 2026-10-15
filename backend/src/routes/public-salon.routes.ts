import { Router } from "express";
import {
  listPublicSalons,
  getPublicSalon,
} from "../controllers/public-salon.controller";
import { validate } from "../middlewares/validate";
import { salonIdSchema } from "../validators/salon.validator";

const router = Router();

router.get("/", listPublicSalons);
router.get("/:id", validate(salonIdSchema), getPublicSalon);

export default router;
