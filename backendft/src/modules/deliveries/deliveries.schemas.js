import { z } from "zod";
import { DELAY_REASONS, ORDER_STATUS } from "../../utils/constants.js";
import { id } from "../../utils/schemas.js";

export const orderIdParams = z.object({ orderId: id });

export const deliveryListQuery = z.object({
  status: z.enum([ORDER_STATUS.OUT_FOR_DELIVERY, ORDER_STATUS.DELIVERED]).optional(),
});

export const delayBody = z.object({
  reason: z.enum(DELAY_REASONS),
  minutes: z.number().int().min(5).max(240),
});
