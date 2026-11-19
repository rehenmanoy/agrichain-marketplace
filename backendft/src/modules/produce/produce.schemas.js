import { z } from "zod";
import { PRODUCE_CATEGORIES } from "../../utils/constants.js";

export const listProduceQuery = z.object({
  category: z.enum(PRODUCE_CATEGORIES).optional(),
});

export const createProduceSchema = z.object({
  name: z.string().trim().min(2).max(50),
  category: z.enum(PRODUCE_CATEGORIES),
  unit: z.string().trim().min(1).max(20).default("kg"),
});
