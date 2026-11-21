const express = require("express");
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/payment.controller");
const {
  createOrderSchema,
  verifyPaymentSchema,
} = require("../validators/payment.validator");

const router = express.Router();

router.use(auth);

router.post("/razorpay/create", validate(createOrderSchema), createRazorpayOrder);
router.post("/razorpay/verify", validate(verifyPaymentSchema), verifyRazorpayPayment);

module.exports = router;