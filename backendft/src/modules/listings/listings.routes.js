import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./listings.controller.js";
import { browseListingsQuery, createListingSchema, updateListingSchema } from "./listings.schemas.js";

const router = express.Router();
const farmerOnly = [requireAuth, requireRole(ROLES.FARMER)];

// Public browsing
router.get("/", validate({ query: browseListingsQuery }), controller.browse);

// Farmer's own listings ("/mine" must come before "/:id")
router.get("/mine", ...farmerOnly, controller.mine);
router.post("/", ...farmerOnly, validate({ body: createListingSchema }), controller.create);
router.patch(
  "/:id",
  ...farmerOnly,
  validate({ params: idParams, body: updateListingSchema }),
  controller.update,
);
router.patch("/:id/deactivate", ...farmerOnly, validate({ params: idParams }), controller.deactivate);

router.delete("/:id", ...farmerOnly, validate({ params: idParams }), controller.remove);

router.get("/:id", validate({ params: idParams }), controller.getOne);

export default router;
