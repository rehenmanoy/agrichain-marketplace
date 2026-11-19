import express from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.schemas.js";

const router = express.Router();

const limiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { error: { message: "Too many attempts, please try again later" } },
  });

// Slow down password guessing
const authLimiter = limiter(20);
// Asking for codes is stricter: each one is a message that costs money once SMS is connected
const codeLimiter = limiter(5);

router.post("/register", authLimiter, validate({ body: registerSchema }), controller.register);
router.post("/login", authLimiter, validate({ body: loginSchema }), controller.login);
router.get("/me", requireAuth, controller.me);
router.patch("/me", requireAuth, validate({ body: updateProfileSchema }), controller.updateMe);
router.post("/refresh", requireAuth, controller.refresh);
router.post("/change-password", requireAuth, authLimiter, validate({ body: changePasswordSchema }), controller.changePassword);
router.post("/forgot-password", codeLimiter, validate({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), controller.resetPassword);

export default router;
