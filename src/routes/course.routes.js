const express = require("express");
const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");
const { publicUrl } = require("../services/upload.service");
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/course.controller");
const ApiResponse = require("../utils/ApiResponse");

const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) return auth(req, res, next);
  next();
};

router.get("/", optionalAuth, listCourses);
router.get("/:id", getCourse);

// Image upload (admin)
router.post(
  "/upload-image",
  auth,
  authorize("admin"),
  upload.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    res.status(200).json(new ApiResponse(200, { imageUrl: publicUrl(req.file.filename) }, "Uploaded"));
  }
);

router.post("/", auth, authorize("admin"), createCourse);
router.patch("/:id", auth, authorize("admin"), updateCourse);
router.delete("/:id", auth, authorize("admin"), deleteCourse);

module.exports = router;