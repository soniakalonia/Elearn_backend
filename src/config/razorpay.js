const Razorpay = require("razorpay");
const env = require("./env");
const ApiError = require("../utils/ApiError");

if (!env.RAZORPAY.KEY_ID || !env.RAZORPAY.KEY_SECRET) {
  console.warn(
    "[razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env — Razorpay payments will fail."
  );
}

const instance = new Razorpay({
  key_id: env.RAZORPAY.KEY_ID,
  key_secret: env.RAZORPAY.KEY_SECRET,
});

function getRazorpay() {
  if (!env.RAZORPAY.KEY_ID || !env.RAZORPAY.KEY_SECRET) {
    throw new ApiError(500, "Payment gateway is not configured");
  }
  return instance;
}

module.exports = { getRazorpay };