const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Enrollment = require("../models/Enrollment");

exports.listMine = asyncHandler(async (req, res) => {
  const rows = await Enrollment.findByUser(req.user.id);
  return res.json(new ApiResponse(200, { enrollments: rows }, "Enrollments fetched"));
});

exports.stats = asyncHandler(async (req, res) => {
  const s = await Enrollment.statsForUser(req.user.id);
  return res.json(new ApiResponse(200, { stats: s }, "Stats fetched"));
});

exports.create = asyncHandler(async (req, res) => {
  const courseId = Number(req.body.courseId);
  if (!courseId) throw new ApiError(400, "courseId required");
  const existing = await Enrollment.findOne(req.user.id, courseId);
  if (existing) return res.json(new ApiResponse(200, { enrollment: existing }, "Already enrolled"));
  const row = await Enrollment.create({ userId: req.user.id, courseId });
  return res.status(201).json(new ApiResponse(201, { enrollment: row }, "Enrolled"));
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  if (!courseId) throw new ApiError(400, "courseId required");
  const { progress, lastLesson } = req.body;
  const row = await Enrollment.updateProgress(req.user.id, courseId, { progress, lastLesson });
  if (!row) throw new ApiError(404, "Enrollment not found");
  return res.json(new ApiResponse(200, { enrollment: row }, "Progress updated"));
});