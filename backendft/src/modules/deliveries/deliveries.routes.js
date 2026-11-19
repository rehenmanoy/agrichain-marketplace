import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import * as controller from "./deliveries.controller.js";
import { delayBody, deliveryListQuery, orderIdParams } from "./deliveries.schemas.js";

const router = express.Router();
const byOrderId = validate({ params: orderIdParams });

router.use(requireAuth, requireRole(ROLES.DELIVERY_PARTNER));

router.get("/available", controller.available);
router.get("/mine", validate({ query: deliveryListQuery }), controller.mine);
router.patch("/:orderId/accept", byOrderId, controller.accept);
router.patch("/:orderId/complete", byOrderId, controller.complete);
router.patch("/:orderId/delay", validate({ params: orderIdParams, body: delayBody }), controller.reportDelay);
router.patch("/:orderId/release", byOrderId, controller.release);

export default router;
