const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const userService = require("../services/user.service");

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, search, role } = req.query;
  const result = await userService.listUsers({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    search: search || "",
    role,
  });
  res.status(200).json(new ApiResponse(200, result, "Users fetched"));
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const isActive = req.body.isActive === true || req.body.isActive === "true";
  const user = await userService.setActive(userId, isActive);
  res.status(200).json(new ApiResponse(200, { user }, "User status updated"));
});

module.exports = { listUsers, updateUserStatus };