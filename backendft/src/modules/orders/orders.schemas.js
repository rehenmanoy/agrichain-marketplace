import { z } from "zod";
import { ORDER_STATUS } from "../../utils/constants.js";
import { id } from "../../utils/schemas.js";

export const orderItemSchema = z.object({
  listing_id: id,
  quantity: z.coerce.number().int().positive(),
});

// Defaults to the buyer's base location. Items from several farmers become one order per farmer.
export const deliveryAddress = z.string().trim().min(3).max(300).optional();

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(50),
  delivery_address: deliveryAddress,
});

export const orderListQuery = z.object({
  status: z.enum(Object.values(ORDER_STATUS)).optional(),
});
