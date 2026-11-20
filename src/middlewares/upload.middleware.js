const multer = require("multer");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const uploadRoot = path.resolve(__dirname, "../../", env.UPLOAD_DIR);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype);
  cb(ok ? null : new ApiError(400, "Only image files are allowed"), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;