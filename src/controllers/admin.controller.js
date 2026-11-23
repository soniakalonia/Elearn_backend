const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const adminService = require("../services/admin.service");

function parseDateRange(query) {
  const { range, start, end } = query;
  const now = new Date();
  let startDate = new Date(now.setHours(0, 0, 0, 0)); // Default to Today
  let endDate = new Date();

  if (range === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "1m") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "custom" && start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
  }
  return { startDate, endDate };
}

exports.getStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const stats = await adminService.getStats({ startDate, endDate });
  return res.json(new ApiResponse(200, stats, "Admin stats fetched"));
});

exports.getOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const { startDate, endDate } = parseDateRange(req.query);

  const data = await adminService.listOrders({ page, limit, startDate, endDate });
  return res.json(new ApiResponse(200, data, "Admin orders fetched"));
});