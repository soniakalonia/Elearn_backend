const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const pathService = require("../services/path.service");

exports.list = asyncHandler(async (_req, res) => {
  const paths = await pathService.list();
  return res.json(new ApiResponse(200, { paths }, "Paths fetched"));
});

exports.get = asyncHandler(async (req, res) => {
  const path = await pathService.get(Number(req.params.id));
  return res.json(new ApiResponse(200, { path }, "Path fetched"));
});

exports.create = asyncHandler(async (req, res) => {
  const path = await pathService.create(req.body);
  return res.status(201).json(new ApiResponse(201, { path }, "Path created"));
});

exports.update = asyncHandler(async (req, res) => {
  const path = await pathService.update(Number(req.params.id), req.body);
  return res.json(new ApiResponse(200, { path }, "Path updated"));
});

exports.remove = asyncHandler(async (req, res) => {
  await pathService.remove(Number(req.params.id));
  return res.json(new ApiResponse(200, {}, "Path deleted"));
});