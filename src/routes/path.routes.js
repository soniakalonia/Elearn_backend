const express = require("express");
const controller = require("../controllers/path.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

// Public: anyone can browse career tracks
router.get("/", controller.list);
router.get("/:id", controller.get);

// Admin only: create / update / delete
router.post("/", auth, role("admin"), controller.create);
router.patch("/:id", auth, role("admin"), controller.update);
router.delete("/:id", auth, role("admin"), controller.remove);

module.exports = router;