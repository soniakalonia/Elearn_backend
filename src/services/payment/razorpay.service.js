const crypto = require("crypto");
const env = require("../../config/env");
const { getRazorpay } = require("../../config/razorpay");
const ApiError = require("../../utils/ApiError");

/**
 * Create a Razorpay order.
 * @param {Object} params
 * @param {number} params.amountInPaise  - amount in smallest unit (paise)
 * @param {string} params.receipt         - your internal order code
 * @param {Object} [params.notes]
 * @returns {Promise<{ id: string, amount: number, currency: string, receipt: string, status: string }>}
 */
async function createOrder({ amountInPaise, receipt, notes = {} }) {
  if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
    throw new ApiError(400, "Amount must be at least ₹1");
  }
  const rzp = getRazorpay();
  try {
    const order = await rzp.orders.create({
      amount: Math.round(amountInPaise),
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1,
    });
    return order;
  } catch (err) {
    const message =
      err?.error?.description || err?.message || "Failed to create Razorpay order";
    throw new ApiError(502, `Razorpay: ${message}`);
  }
}

/**
 * Verify the HMAC signature Razorpay sends back after a successful payment.
 * @param {Object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @returns {boolean}
 */
function verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  if (!env.RAZORPAY.KEY_SECRET) return false;

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY.KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(razorpaySignature), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { createOrder, verifySignature };