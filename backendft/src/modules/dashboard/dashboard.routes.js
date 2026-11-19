import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getDashboard } from "./dashboard.service.js";

const router = express.Router();

// Role-aware summary stats for the logged-in user's dashboard
router.get("/", requireAuth, async (req, res) => {
  res.json(await getDashboard(req.user));
});

export default router;
