import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import regionRoutes from "./modules/regions/regions.routes.js";
import produceRoutes from "./modules/produce/produce.routes.js";
import listingRoutes from "./modules/listings/listings.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import warehouseRoutes from "./modules/warehouses/warehouses.routes.js";
import bookingRoutes from "./modules/bookings/bookings.routes.js";
import deliveryRoutes from "./modules/deliveries/deliveries.routes.js";
import reviewRoutes from "./modules/reviews/reviews.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/regions", regionRoutes);
router.use("/produce", produceRoutes);
router.use("/listings", listingRoutes);
router.use("/orders", orderRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/warehouse-bookings", bookingRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/reviews", reviewRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/cart", cartRoutes);
router.use("/notifications", notificationRoutes);

export default router;
