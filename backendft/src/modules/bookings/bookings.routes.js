import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./bookings.controller.js";
import * as reviewsController from "../reviews/reviews.controller.js";
import { createReviewSchema } from "../reviews/reviews.schemas.js";
import { bookingListQuery, createBookingSchema, decisionSchema, extendBookingSchema } from "./bookings.schemas.js";

const router = express.Router();
const farmerOnly = requireRole(ROLES.FARMER);
const ownerOnly = requireRole(ROLES.WAREHOUSE_OWNER);
const byId = validate({ params: idParams });

router.use(requireAuth);

// Farmer: ask for space, then cancel, release or extend
router.post("/", farmerOnly, validate({ body: createBookingSchema }), controller.create);
router.get("/mine", farmerOnly, validate({ query: bookingListQuery }), controller.mine);
router.patch("/:id/cancel", farmerOnly, byId, controller.cancel);
router.patch("/:id/release", farmerOnly, byId, controller.release);
router.post("/:id/extend", farmerOnly, validate({ params: idParams, body: extendBookingSchema }), controller.extend);
router.patch("/:id/extension/cancel", farmerOnly, byId, controller.cancelExtension);
router.post(
  "/:id/review",
  farmerOnly,
  validate({ params: idParams, body: createReviewSchema }),
  reviewsController.createWarehouse,
);

// Owner: see requests and answer them
router.get("/incoming", ownerOnly, validate({ query: bookingListQuery }), controller.incoming);
router.patch("/:id/approve", ownerOnly, byId, controller.approve);
router.patch("/:id/reject", ownerOnly, validate({ params: idParams, body: decisionSchema }), controller.reject);
router.patch("/:id/extension/approve", ownerOnly, byId, controller.approveExtension);
router.patch("/:id/extension/reject", ownerOnly, byId, controller.rejectExtension);

export default router;
