const express = require("express");
const controller = require("../controllers/admin.controller");
const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

const router = express.Router();

router.use(auth, authorize("admin"));

router.get("/stats", controller.getStats);
router.get("/orders", controller.getOrders); // <-- Added

module.exports = router;