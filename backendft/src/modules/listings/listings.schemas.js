import { z } from "zod";
import { PRODUCE_CATEGORIES } from "../../utils/constants.js";
import { id } from "../../utils/schemas.js";

const price = z.coerce.number().positive().multipleOf(0.01, "Price can have at most 2 decimals");

export const browseListingsQuery = z.object({
  region_id: id.optional(),
  produce_id: id.optional(),
  category: z.enum(PRODUCE_CATEGORIES).optional(),
  search: z.string().trim().min(1).max(50).optional(),
});

export const createListingSchema = z.object({
  produce_id: id,
  available_qty: z.coerce.number().int().positive(),
  // Optional: defaults to today's market price; must stay within the allowed band
  listing_price: price.optional(),
});

export const updateListingSchema = z
  .object({
    available_qty: z.coerce.number().int().min(0).optional(),
    listing_price: price.optional(),
    // true puts a stopped listing back on sale (needs stock)
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide available_qty, listing_price and/or is_active",
  });
