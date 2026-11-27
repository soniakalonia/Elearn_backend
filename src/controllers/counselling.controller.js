const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const service = require("../services/counselling.service");

exports.getPlans = asyncHandler(async (req, res) => {
  const plans = await service.getPublicPlans();
  return res.json(new ApiResponse(200, { plans }, "Counselling plans fetched"));
});

exports.getOptions = asyncHandler(async (req, res) => {
  const options = await service.getPublicOptions();
  return res.json(new ApiResponse(200, options, "Counselling options fetched"));
});

exports.createBooking = asyncHandler(async (req, res) => {
  const result = await service.createBooking({
    userId: req.user.id,
    user: req.user,
    payload: req.body,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, result, "Booking created — please complete payment"));
});

exports.verifyPrePayment = asyncHandler(async (req, res) => {
  const result = await service.verifyPrePayment({
    bookingId: Number(req.params.id),
    userId: req.user.id,
    razorpayOrderId: req.body.razorpay_order_id,
    razorpayPaymentId: req.body.razorpay_payment_id,
    razorpaySignature: req.body.razorpay_signature,
  });
  return res.json(new ApiResponse(200, result, "Pre-payment verified"));
});

exports.createPostPaymentOrder = asyncHandler(async (req, res) => {
  const result = await service.createPostPaymentOrder({
    bookingId: Number(req.params.id),
    userId: req.user.id,
  });
  return res.json(
    new ApiResponse(200, result, result.alreadyCompleted ? "Already completed" : "Post-payment order created")
  );
});

exports.verifyPostPayment = asyncHandler(async (req, res) => {
  const result = await service.verifyPostPayment({
    bookingId: Number(req.params.id),
    userId: req.user.id,
    razorpayOrderId: req.body.razorpay_order_id,
    razorpayPaymentId: req.body.razorpay_payment_id,
    razorpaySignature: req.body.razorpay_signature,
  });
  return res.json(new ApiResponse(200, result, "Remaining payment verified"));
});

exports.listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await service.listMyBookings(req.user.id);
  return res.json(new ApiResponse(200, { bookings }, "Your bookings fetched"));
});