import { z } from "zod";
import { deliveryAddress, orderItemSchema } from "../orders/orders.schemas.js";

export const addToCartSchema = orderItemSchema;

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const checkoutSchema = z.object({
  delivery_address: deliveryAddress,
});
