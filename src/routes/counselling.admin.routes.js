const express = require("express");
const validate = require("../middlewares/validate.middleware");
const controller = require("../controllers/counselling.admin.controller");
const upload = require("../middlewares/upload.middleware");
const { updatePlanSchema, listBookingsQuerySchema } = require("../validators/counselling.validator");

const router = express.Router();

/* Plans */
router.get("/plans", controller.getPlans);
router.put("/plans/:duration", validate(updatePlanSchema), controller.updatePlan);
router.delete("/plans/:id", controller.deletePlan);

/* Questions */
router.get("/questions", controller.getQuestions);
router.post("/questions", controller.createQuestion);
router.put("/questions/:id", controller.updateQuestion);
router.delete("/questions/:id", controller.deleteQuestion);

/* Options */
router.post("/options", upload.single("image"), controller.createOption);
router.put("/options/:id", upload.single("image"), controller.updateOption);
router.delete("/options/:id", controller.deleteOption);

/* Bookings */
router.get("/bookings", validate(listBookingsQuerySchema), controller.listBookings);
router.get("/stats", controller.stats);

module.exports = router;