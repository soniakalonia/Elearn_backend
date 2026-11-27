const ApiError = require("../utils/ApiError");
const { Plans, Questions, Bookings, Payments } = require("../models/Counselling");
const { getProvider } = require("./payment/payment.factory");
const env = require("../config/env");

function generateBookingCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CNS-${stamp}-${rand}`;
}

function rangeToDates(range) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let from = null;
  if (range === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  else if (range === "7d") { from = new Date(now); from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0); }
  else if (range === "1m") { from = new Date(now); from.setMonth(from.getMonth() - 1); from.setHours(0, 0, 0, 0); }
  return { from, to };
}

async function getPublicPlans() {
  const plans = await Plans.listActive();
  if (!plans.length) throw new ApiError(503, "Counselling is not available right now.");
  return plans;
}

async function getPublicOptions() {
  const questions = await Questions.listActive();
  return { questions }; // Return as object with questions key
}

async function createBooking({ userId, payload }) {
  const plan = await Plans.findById(payload.planId);
  if (!plan || !plan.isActive) throw new ApiError(400, "The selected counselling duration is not available");
  if (plan.totalAmount <= 0 || plan.preAmount <= 0) throw new ApiError(503, "Pricing is not configured.");

  const remainingAmount = Number((plan.totalAmount - plan.preAmount).toFixed(2));
  const booking = await Bookings.create({
    bookingCode: generateBookingCode(),
    userId,
    planId: plan.id,
    durationMinutes: plan.durationMinutes,
    answers: payload.answers,
    preferredDate: payload.preferredDate,
    preferredTime: payload.preferredTime,
    contactName: payload.contactName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    preAmount: plan.preAmount,
    totalAmount: plan.totalAmount,
    remainingAmount,
    status: "PENDING_PAYMENT",
  });

  const provider = getProvider("razorpay");
  const rzpOrder = await provider.createOrder({
    amountInPaise: Math.round(plan.preAmount * 100),
    receipt: booking.bookingCode,
    notes: { bookingId: String(booking.id), userId: String(userId), purpose: "counselling_pre" },
  });

  const payment = await Payments.create({ bookingId: booking.id, type: "PRE", amount: plan.preAmount, razorpayOrderId: rzpOrder.id });

  return {
    booking,
    payment: {
      paymentId: payment.id, type: "PRE", amount: plan.preAmount, razorpayOrderId: rzpOrder.id, razorpayKey: env.RAZORPAY.KEY_ID,
      prefill: { name: payload.contactName, email: payload.contactEmail, contact: payload.contactPhone },
      notes: rzpOrder.notes,
    },
  };
}

async function verifyPrePayment({ bookingId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const booking = await Bookings.findByIdForUser(bookingId, userId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "PRE_PAID" || booking.status === "COMPLETED") return { booking, alreadyPaid: true };
  if (booking.status !== "PENDING_PAYMENT") throw new ApiError(400, `Booking is not payable`);

  const prePayment = await Payments.findByBookingAndType(booking.id, "PRE");
  if (!prePayment) throw new ApiError(400, "Payment record not found");

  const provider = getProvider("razorpay");
  const ok = provider.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!ok) throw new ApiError(400, "Payment signature verification failed");

  await Payments.markPaid({ id: prePayment.id, razorpayPaymentId, razorpaySignature });
  const updated = await Bookings.updateStatus(booking.id, "PRE_PAID");
  return { booking: updated, alreadyPaid: false };
}

async function createPostPaymentOrder({ bookingId, userId }) {
  const booking = await Bookings.findByIdForUser(bookingId, userId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "COMPLETED") return { alreadyCompleted: true, booking };
  if (booking.status !== "PRE_PAID") throw new ApiError(400, `Remaining amount can only be paid after the session is pre-paid`);
  if (booking.remainingAmount <= 0) throw new ApiError(400, "No remaining amount to pay");

  const provider = getProvider("razorpay");
  const rzpOrder = await provider.createOrder({
    amountInPaise: Math.round(booking.remainingAmount * 100),
    receipt: `${booking.bookingCode}-POST`,
    notes: { bookingId: String(booking.id), userId: String(userId), purpose: "counselling_post" },
  });

  const payment = await Payments.create({ bookingId: booking.id, type: "POST", amount: booking.remainingAmount, razorpayOrderId: rzpOrder.id });

  return {
    alreadyCompleted: false,
    booking,
    payment: {
      paymentId: payment.id, type: "POST", amount: booking.remainingAmount, razorpayOrderId: rzpOrder.id, razorpayKey: env.RAZORPAY.KEY_ID,
      prefill: { name: booking.contactName, email: booking.contactEmail, contact: booking.contactPhone },
      notes: rzpOrder.notes,
    },
  };
}

async function verifyPostPayment({ bookingId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const booking = await Bookings.findByIdForUser(bookingId, userId);
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "COMPLETED") return { booking, alreadyPaid: true };
  if (booking.status !== "PRE_PAID") throw new ApiError(400, `Booking is not payable`);

  const postPayment = await Payments.findByBookingAndType(booking.id, "POST");
  if (!postPayment) throw new ApiError(400, "Post-payment record not found");

  const provider = getProvider("razorpay");
  const ok = provider.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!ok) throw new ApiError(400, "Payment signature verification failed");

  await Payments.markPaid({ id: postPayment.id, razorpayPaymentId, razorpaySignature });
  const updated = await Bookings.updateStatus(booking.id, "COMPLETED");
  return { booking: updated, alreadyPaid: false };
}

async function listMyBookings(userId) { return Bookings.findByUser(userId); }

/* ADMIN */
async function adminListPlans() { return Plans.listAll(); }
async function adminUpdatePlan(durationMinutes, { preAmount, totalAmount, isActive }) {
  const duration = Number(durationMinutes);
  if (duration <= 0) throw new ApiError(400, "Duration must be greater than 0");
  if (totalAmount < preAmount) throw new ApiError(400, "Total amount cannot be less than pre-amount");
  return Plans.upsert({ durationMinutes: duration, preAmount, totalAmount, isActive });
}
async function adminDeletePlan(id) { return Plans.remove(id); }

async function adminListQuestions() { return Questions.listAll(); }
async function adminCreateQuestion(payload) { return Questions.createQuestion(payload); }
async function adminUpdateQuestion(id, payload) { return Questions.updateQuestion(id, payload); }
async function adminDeleteQuestion(id) { return Questions.removeQuestion(id); }
async function adminCreateOption(payload) { return Questions.createOption(payload); }
async function adminUpdateOption(id, payload) { return Questions.updateOption(id, payload); }
async function adminDeleteOption(id) { return Questions.removeOption(id); }

async function adminListBookings({ range, page, limit }) { const { from, to } = rangeToDates(range); return Bookings.listAdmin({ from, to, page, limit }); }
async function adminStats({ range }) { const { from, to } = rangeToDates(range); const total = await Bookings.countByRange({ from, to }); return { range, total }; }

module.exports = {
  getPublicPlans, getPublicOptions, createBooking, verifyPrePayment, createPostPaymentOrder, verifyPostPayment, listMyBookings,
  adminListPlans, adminUpdatePlan, adminDeletePlan,
  adminListQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion,
  adminCreateOption, adminUpdateOption, adminDeleteOption,
  adminListBookings, adminStats,
};