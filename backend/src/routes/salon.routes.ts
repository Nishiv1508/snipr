import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { salonController } from "../controllers/salon.controller";
import { createSalonSchema } from "../validators/salon.validator";

const router = Router();

router.use(authenticate);
router.get("/mine", (req, res, next) => salonController.listMine(req, res, next));
router.post("/", validate(createSalonSchema), (req, res, next) =>
  salonController.create(req, res, next),
);

export default router;
