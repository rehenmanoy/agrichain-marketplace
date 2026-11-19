import express from "express";
import { validate } from "../../middleware/validate.js";
import * as controller from "./reviews.controller.js";
import { listPartnerReviewsQuery, listReviewsQuery, listWarehouseReviewsQuery } from "./reviews.schemas.js";

const router = express.Router();

// Public lists. Creating a review lives next to what is being reviewed:
// POST /api/orders/:id/review (farmer), POST /api/orders/:id/partner-review, POST /api/warehouse-bookings/:id/review
router.get("/", validate({ query: listReviewsQuery }), controller.list);
router.get("/partners", validate({ query: listPartnerReviewsQuery }), controller.listPartner);
router.get("/warehouses", validate({ query: listWarehouseReviewsQuery }), controller.listWarehouse);

export default router;
