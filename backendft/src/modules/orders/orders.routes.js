import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./orders.controller.js";
import { createOrderSchema, orderListQuery } from "./orders.schemas.js";
import * as reviewsController from "../reviews/reviews.controller.js";
import { createReviewSchema } from "../reviews/reviews.schemas.js";

const router = express.Router();
const buyerOnly = requireRole(ROLES.BUYER);
const farmerOnly = requireRole(ROLES.FARMER);
const byId = validate({ params: idParams });

router.use(requireAuth);

router.post("/", buyerOnly, validate({ body: createOrderSchema }), controller.create);
router.get("/mine", buyerOnly, validate({ query: orderListQuery }), controller.mine);
router.get("/incoming", farmerOnly, validate({ query: orderListQuery }), controller.incoming);

router.patch("/:id/cancel", requireRole(ROLES.BUYER, ROLES.FARMER), byId, controller.cancel);
router.patch("/:id/confirm", farmerOnly, byId, controller.confirm);
router.post(
  "/:id/review",
  buyerOnly,
  validate({ params: idParams, body: createReviewSchema }),
  reviewsController.create,
);
router.post(
  "/:id/partner-review",
  buyerOnly,
  validate({ params: idParams, body: createReviewSchema }),
  reviewsController.createPartner,
);

export default router;
