const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const adminService = require("../services/admin.service");

exports.getStats = asyncHandler(async (_req, res) => {
  const stats = await adminService.getStats();
  return res.json(new ApiResponse(200, stats, "Admin stats fetched"));
});