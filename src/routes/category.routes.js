const express = require("express");
const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) return auth(req, res, next);
  next();
};

router.get("/", optionalAuth, listCategories);
router.post("/", auth, authorize("admin"), createCategory);
router.patch("/:id", auth, authorize("admin"), updateCategory);
router.delete("/:id", auth, authorize("admin"), deleteCategory);

module.exports = router;