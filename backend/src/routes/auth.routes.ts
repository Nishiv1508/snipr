import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  registerSchema,
  loginSchema,
  enable2FASchema,
  verifyLogin2FASchema,
  disable2FASchema,
} from "../validators/auth.validator";

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

router.post("/logout", (req, res, next) => {
  authController.logout(req, res, next);
});

router.get("/me", authenticate, (req, res, next) => {
  authController.me(req, res, next);
});

router.post("/refresh", (req, res, next) =>
  authController.refresh(req, res, next),
);

router.post("/2fa/setup", loginLimiter, (req, res, next) =>
  authController.setup2FA(req, res, next),
);

router.post(
  "/2fa/enable",
  loginLimiter,
  validate(enable2FASchema),
  (req, res, next) => authController.enable2FA(req, res, next),
);

router.post(
  "/2fa/verify-login",
  loginLimiter,
  validate(verifyLogin2FASchema),
  (req, res, next) => authController.verifyLogin2FA(req, res, next),
);

router.post(
  "/2fa/disable",
  authenticate,
  loginLimiter,
  validate(disable2FASchema),
  (req, res, next) => authController.disable2FA(req, res, next),
);

export default router;
