const express = require("express");
const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const { listUsers, updateUserStatus } = require("../controllers/user.controller");

const router = express.Router();

router.use(auth, authorize("admin"));

router.get("/", listUsers);
router.patch("/:id/status", updateUserStatus);

module.exports = router;