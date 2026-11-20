const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");

const signup = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Account created successfully"));
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, result, "Logged in successfully"));
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.status(200).json(new ApiResponse(200, { user }, "Current user"));
});

module.exports = { signup, login, me };