const Joi = require("joi");

const createBookingSchema = Joi.object({
  planId: Joi.number().integer().positive().required(),
  answers: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  preferredDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  preferredTime: Joi.string().trim().min(3).max(20).required(),
  contactName: Joi.string().trim().min(2).max(120).required(),
  contactEmail: Joi.string().trim().email().max(150).required(),
  contactPhone: Joi.string().trim().pattern(/^[0-9+\-\s()]{8,20}$/).required(),
});

const verifyCounsellingPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().trim().max(120).required(),
  razorpay_payment_id: Joi.string().trim().max(120).required(),
  razorpay_signature: Joi.string().trim().max(255).required(),
});

const updatePlanSchema = Joi.object({
  preAmount: Joi.number().min(1).max(100000).required(),
  totalAmount: Joi.number().min(1).max(500000).required(),
  isActive: Joi.boolean().default(true),
}).custom((value, helpers) => {
  if (value.totalAmount < value.preAmount) return helpers.message({ custom: "Total amount must be greater than or equal to pre-amount" });
  return value;
});

const listBookingsQuerySchema = Joi.object({
  range: Joi.string().valid("today", "7d", "1m", "all").default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createBookingSchema, verifyCounsellingPaymentSchema, updatePlanSchema, listBookingsQuerySchema };