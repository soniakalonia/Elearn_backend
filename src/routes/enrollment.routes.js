const express = require("express");
const controller = require("../controllers/enrollment.controller");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/mine", auth, controller.listMine);
router.get("/stats", auth, controller.stats);
router.post("/", auth, controller.create);
router.patch("/:courseId/progress", auth, controller.updateProgress);

module.exports = router;