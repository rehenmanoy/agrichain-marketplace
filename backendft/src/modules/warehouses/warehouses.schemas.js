import { z } from "zod";
import { id, isoDate } from "../../utils/schemas.js";

export const browseWarehousesQuery = z.object({
  region_id: id.optional(),
  cold_storage: z.stringbool().optional(),
});

// Creating a warehouse is a multipart form (it carries photos), so every value may arrive as text
const coldStorage = z.union([z.boolean(), z.stringbool()]);

const warehouseFields = {
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(200),
  total_capacity_kg: z.coerce.number().positive(),
  price_per_kg_per_day: z.coerce.number().min(0),
  is_cold_storage: coldStorage,
};

export const createWarehouseSchema = z.object({
  ...warehouseFields,
  is_cold_storage: coldStorage.default(false),
});

export const updateWarehouseSchema = z
  .object({ ...warehouseFields, is_active: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });

export const availabilityQuery = z
  .object({ from: isoDate, to: isoDate })
  .refine((data) => data.to >= data.from, { message: "to must be on or after from", path: ["to"] });

export const photoParams = z.object({ id, photoId: id });
