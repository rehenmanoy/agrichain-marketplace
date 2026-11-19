import { z } from "zod";
import { ROLES } from "../../utils/constants.js";
import { id } from "../../utils/schemas.js";

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit mobile number");

const password = z.string().min(8, "Password must be at least 8 characters").max(72);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone,
  password,
  role: z.enum(Object.values(ROLES)),
  region_id: id,
  base_location: z.string().trim().max(200).optional(),
});

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, "Password is required"),
});

// Phone and area can't be changed: the phone is the login and the area ties the user to their orders,
// listings, deliveries and warehouses
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    base_location: z.string().trim().min(2).max(200),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password"),
  new_password: password,
});

export const forgotPasswordSchema = z.object({ phone });

export const resetPasswordSchema = z.object({
  phone,
  code: z.string().trim().regex(/^\d{6}$/, "The code is 6 digits"),
  new_password: password,
});
