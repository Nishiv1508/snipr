import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again later.",
    },
  },
});

router.post(
  "/register",
  loginLimiter,
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next),
);

router.post("/login", loginLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

router.post("/logout", (req, res) => {
  authController.logout(req, res);
});

router.get("/me", authenticate, (req, res, next) => {
  authController.me(req, res, next);
});

export default router;
