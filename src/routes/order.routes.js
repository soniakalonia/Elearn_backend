const express = require("express");
const controller = require("../controllers/order.controller");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/mine", auth, controller.listMine);
router.post("/", auth, controller.create);
router.get("/:id", auth, controller.getOne);

module.exports = router;