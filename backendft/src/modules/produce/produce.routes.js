import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./produce.controller.js";
import { createProduceSchema, listProduceQuery } from "./produce.schemas.js";

const router = express.Router();

router.get("/", validate({ query: listProduceQuery }), controller.list);
router.get("/prices", controller.prices);
router.get("/:id/price", validate({ params: idParams }), controller.price);
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.FARMER),
  validate({ body: createProduceSchema }),
  controller.create,
);

export default router;
