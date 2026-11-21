const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
const courseRoutes = require("./course.routes");
const cartRoutes = require("./cart.routes");
const wishlistRoutes = require("./wishlist.routes");
const pathRoutes = require("./path.routes");
const enrollmentRoutes = require("./enrollment.routes");   // NEW
const orderRoutes = require("./order.routes");
const adminRoutes = require("./admin.routes");   

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/courses", courseRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/paths", pathRoutes);
router.use("/enrollments", enrollmentRoutes);  // NEW
router.use("/orders", orderRoutes);   
router.use("/admin", adminRoutes);
module.exports = router;