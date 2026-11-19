import express from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./notifications.controller.js";

const router = express.Router();

const listQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) });

// Everyone sees only their own notifications, whatever their role
router.use(requireAuth);

router.get("/", validate({ query: listQuery }), controller.list);
router.post("/read-all", controller.readAll);
router.patch("/:id/read", validate({ params: idParams }), controller.read);

export default router;
