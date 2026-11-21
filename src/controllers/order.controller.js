const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Order = require("../models/Order");

exports.listMine = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const rows = await Order.findByUser(req.user.id, limit);
  return res.json(new ApiResponse(200, { orders: rows }, "Orders fetched"));
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(Number(req.params.id));
  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "Not allowed");
  }
  return res.json(new ApiResponse(200, { order }, "Order fetched"));
});

exports.create = asyncHandler(async (req, res) => {
  const { items, subtotal, discount, total, paymentMethod, paymentRef } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "items required");
  const order = await Order.create({
    userId: req.user.id,
    items,
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    total: Number(total) || 0,
    paymentMethod,
    paymentRef,
  });
  return res.status(201).json(new ApiResponse(201, { order }, "Order created"));
});