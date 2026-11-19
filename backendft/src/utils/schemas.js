import { z } from "zod";

// Shared zod building blocks used by the module schemas
export const id = z.coerce.number().int().positive();
export const idParams = z.object({ id });
export const isoDate = z.iso.date();

/** Today's date as "YYYY-MM-DD" in the server's local timezone */
export function today() {
  return new Date().toLocaleDateString("en-CA");
}
