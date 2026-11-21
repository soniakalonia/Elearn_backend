const Joi = require("joi");

const createOrderSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().max(150).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{8,20}$/)
    .required()
    .messages({ "string.pattern.base": "Phone number is invalid" }),
  country: Joi.string().trim().max(80).default("India"),
});

const verifyPaymentSchema = Joi.object({
  orderId: Joi.number().integer().positive().required(),
  razorpay_order_id: Joi.string().trim().max(120).required(),
  razorpay_payment_id: Joi.string().trim().max(120).required(),
  razorpay_signature: Joi.string().trim().max(255).required(),
});

module.exports = { createOrderSchema, verifyPaymentSchema };