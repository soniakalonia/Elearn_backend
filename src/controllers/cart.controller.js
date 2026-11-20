const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const cartService = require("../services/cart.service");

const listCart = asyncHandler(async (req, res) => {
  const items = await cartService.listCart(req.user.id);
  res.status(200).json(new ApiResponse(200, { items }, "Cart fetched"));
});

const addToCart = asyncHandler(async (req, res) => {
  const items = await cartService.addToCart(req.user.id, Number(req.body.courseId));
  res.status(200).json(new ApiResponse(200, { items }, "Added to cart"));
});

const removeFromCart = asyncHandler(async (req, res) => {
  const items = await cartService.removeFromCart(req.user.id, Number(req.params.courseId));
  res.status(200).json(new ApiResponse(200, { items }, "Removed from cart"));
});

module.exports = { listCart, addToCart, removeFromCart };