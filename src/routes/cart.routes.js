const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { listCart, addToCart, removeFromCart } = require("../controllers/cart.controller");

const router = express.Router();
router.use(auth);

router.get("/", listCart);
router.post("/", addToCart);
router.delete("/:courseId", removeFromCart);

module.exports = router;