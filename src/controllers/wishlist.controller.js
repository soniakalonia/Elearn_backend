const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const wishlistService = require("../services/wishlist.service");

const listWishlist = asyncHandler(async (req, res) => {
  const courseIds = await wishlistService.listWishlist(req.user.id);
  res.status(200).json(new ApiResponse(200, { courseIds }, "Wishlist fetched"));
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleWishlist(req.user.id, Number(req.body.courseId));
  res.status(200).json(new ApiResponse(200, result, "Wishlist updated"));
});

module.exports = { listWishlist, toggleWishlist };