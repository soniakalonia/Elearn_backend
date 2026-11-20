const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { listWishlist, toggleWishlist } = require("../controllers/wishlist.controller");

const router = express.Router();
router.use(auth);

router.get("/", listWishlist);
router.post("/toggle", toggleWishlist);

module.exports = router;