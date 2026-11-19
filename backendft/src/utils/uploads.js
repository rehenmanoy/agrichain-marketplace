import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { badRequest } from "./AppError.js";
import { WAREHOUSE_PHOTOS } from "./constants.js";

const PHOTO_DIR = path.join(env.uploadDir, "warehouses");

/** Public URL of a stored warehouse photo (served by express.static in app.js) */
export const photoUrl = (filename) => `/uploads/warehouses/${filename}`;

// The file's own first bytes decide its type; the type the browser claims is not trusted.
// SVG is deliberately not allowed: it can carry scripts.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IMAGE_TYPES = [
  { ext: "jpg", matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", matches: (b) => b.length > 8 && b.subarray(0, 8).equals(PNG) },
  {
    ext: "webp",
    matches: (b) => b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

/** Multer middleware for the "photos" field: files are held in memory until they have been checked */
export const warehousePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: WAREHOUSE_PHOTOS.MAX_BYTES, files: WAREHOUSE_PHOTOS.MAX },
}).array("photos", WAREHOUSE_PHOTOS.MAX);

/**
 * Checks every file is a real JPEG, PNG or WebP, then saves them under random names.
 * Nothing is written if any file is refused. Returns the new file names.
 */
export async function savePhotos(files) {
  const checked = files.map((file) => {
    const type = IMAGE_TYPES.find((candidate) => candidate.matches(file.buffer));
    if (!type) throw badRequest("Photos must be JPEG, PNG or WebP images");
    return { buffer: file.buffer, name: `${crypto.randomUUID()}.${type.ext}` };
  });

  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await Promise.all(checked.map((file) => fs.writeFile(path.join(PHOTO_DIR, file.name), file.buffer)));
  return checked.map((file) => file.name);
}

/** Best effort: a file that is already gone is not an error */
export async function deletePhotoFiles(filenames) {
  await Promise.all(filenames.map((name) => fs.rm(path.join(PHOTO_DIR, name), { force: true }).catch(() => {})));
}
