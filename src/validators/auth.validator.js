const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().max(150).required(),
  phone: Joi.string().allow("", null).max(20),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

module.exports = { signupSchema, loginSchema };