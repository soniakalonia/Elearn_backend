const express = require("express");
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const controller = require("../controllers/counselling.controller");
const {
  createBookingSchema,
  verifyCounsellingPaymentSchema,
} = require("../validators/counselling.validator");

const router = express.Router();

router.use(auth);

router.get("/plans", controller.getPlans);
router.get("/options", controller.getOptions);
router.get("/my-bookings", controller.listMyBookings);

router.post("/book", validate(createBookingSchema), controller.createBooking);
router.post(
  "/:id/verify-pre",
  validate(verifyCounsellingPaymentSchema),
  controller.verifyPrePayment
);
router.post("/:id/pay-post", controller.createPostPaymentOrder);
router.post(
  "/:id/verify-post",
  validate(verifyCounsellingPaymentSchema),
  controller.verifyPostPayment
);

module.exports = router;