const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const courseService = require("../services/course.service");

const listCourses = asyncHandler(async (req, res) => {
  const includeAll =
    req.query.includeAll === "true" && req.user && req.user.role === "admin";
  const courses = await courseService.listCourses({
    includeAll,
    categoryId: req.query.categoryId,
    search: req.query.search,
  });
  res.status(200).json(new ApiResponse(200, { courses }, "Courses fetched"));
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await courseService.getCourse(Number(req.params.id));
  res.status(200).json(new ApiResponse(200, { course }, "Course fetched"));
});

const createCourse = asyncHandler(async (req, res) => {
  const course = await courseService.createCourse(req.body);
  res.status(201).json(new ApiResponse(201, { course }, "Course created"));
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(Number(req.params.id), req.body);
  res.status(200).json(new ApiResponse(200, { course }, "Course updated"));
});

const deleteCourse = asyncHandler(async (req, res) => {
  await courseService.deleteCourse(Number(req.params.id));
  res.status(200).json(new ApiResponse(200, {}, "Course deleted"));
});

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };