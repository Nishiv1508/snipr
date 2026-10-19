import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireCustomer } from "../middlewares/requireCustomer";
import { validate } from "../middlewares/validate";
import {
  getMyRatingSchema,
  submitRatingSchema,
} from "../validators/rating.validator";
import { getMyRating, submitRating } from "../controllers/rating.controller";

const router = Router();

// All rating routes require an authenticated customer.
router.use(authenticate, requireCustomer);

router.post("/", validate(submitRatingSchema), submitRating);
router.get("/me", validate(getMyRatingSchema), getMyRating);

export default router;
