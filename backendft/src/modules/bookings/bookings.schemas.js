import { z } from "zod";
import { BOOKING_STATUS, MAX_BOOKING_DAYS } from "../../utils/constants.js";
import { id, isoDate, today } from "../../utils/schemas.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysBetween = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY) + 1;

export const createBookingSchema = z
  .object({
    warehouse_id: id,
    produce_id: id.optional(),
    quantity_kg: z.coerce.number().positive(),
    start_date: isoDate.optional(),
    end_date: isoDate.optional(),
  })
  .transform((data) => {
    const start = data.start_date ?? today();
    return { ...data, start_date: start, end_date: data.end_date ?? start };
  })
  .refine((data) => data.start_date >= today(), {
    message: "start_date cannot be in the past",
    path: ["start_date"],
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be on or after start_date",
    path: ["end_date"],
  })
  .refine((data) => daysBetween(data.start_date, data.end_date) <= MAX_BOOKING_DAYS, {
    message: `A booking can be at most ${MAX_BOOKING_DAYS} days`,
    path: ["end_date"],
  });

export const bookingListQuery = z.object({
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
});

// The owner may say why a request was declined
export const decisionSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const extendBookingSchema = z.object({
  new_end_date: isoDate,
});

export { daysBetween };
