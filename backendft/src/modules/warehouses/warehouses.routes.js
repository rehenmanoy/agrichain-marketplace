import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import { warehousePhotoUpload } from "../../utils/uploads.js";
import * as controller from "./warehouses.controller.js";
import {
  availabilityQuery,
  browseWarehousesQuery,
  createWarehouseSchema,
  photoParams,
  updateWarehouseSchema,
} from "./warehouses.schemas.js";

const router = express.Router();
const ownerOnly = [requireAuth, requireRole(ROLES.WAREHOUSE_OWNER)];

router.get("/", validate({ query: browseWarehousesQuery }), controller.browse);
router.get("/mine", ...ownerOnly, controller.mine);
// Creating a warehouse is a multipart form: the fields plus 2 to 5 photos
router.post("/", ...ownerOnly, warehousePhotoUpload, validate({ body: createWarehouseSchema }), controller.create);
router.get("/:id", validate({ params: idParams }), controller.getOne);
router.get(
  "/:id/availability",
  requireAuth,
  validate({ params: idParams, query: availabilityQuery }),
  controller.availability,
);
router.patch("/:id", ...ownerOnly, validate({ params: idParams, body: updateWarehouseSchema }), controller.update);
router.delete("/:id", ...ownerOnly, validate({ params: idParams }), controller.remove);
router.post("/:id/photos", ...ownerOnly, warehousePhotoUpload, validate({ params: idParams }), controller.addPhotos);
router.delete("/:id/photos/:photoId", ...ownerOnly, validate({ params: photoParams }), controller.removePhoto);

export default router;
