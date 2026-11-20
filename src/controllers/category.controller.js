const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const categoryService = require("../services/category.service");

const listCategories = asyncHandler(async (req, res) => {
  const includeInactive =
    req.query.includeInactive === "true" ||
    (req.user && req.user.role === "admin" && req.query.includeInactive !== "false");
  const categories = await categoryService.listCategories({ includeInactive });
  res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched"));
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(new ApiResponse(201, { category }, "Category created"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(Number(req.params.id), req.body);
  res.status(200).json(new ApiResponse(200, { category }, "Category updated"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(Number(req.params.id));
  res.status(200).json(new ApiResponse(200, {}, "Category deleted"));
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };