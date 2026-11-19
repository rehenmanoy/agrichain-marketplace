import { z } from "zod";
import { id } from "../../utils/schemas.js";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export const listReviewsQuery = z.object({
  farmer_id: id,
});

export const listPartnerReviewsQuery = z.object({
  partner_id: id,
});

export const listWarehouseReviewsQuery = z.object({
  warehouse_id: id,
});
