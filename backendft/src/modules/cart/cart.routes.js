import express from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ROLES } from "../../utils/constants.js";
import { idParams } from "../../utils/schemas.js";
import * as controller from "./cart.controller.js";
import { addToCartSchema, checkoutSchema, updateCartItemSchema } from "./cart.schemas.js";

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.BUYER));

router.get("/", controller.get);
router.post("/", validate({ body: addToCartSchema }), controller.add);
router.delete("/", controller.clear);
router.post("/checkout", validate({ body: checkoutSchema }), controller.checkout);
router.patch("/items/:id", validate({ params: idParams, body: updateCartItemSchema }), controller.update);
router.delete("/items/:id", validate({ params: idParams }), controller.remove);

export default router;
