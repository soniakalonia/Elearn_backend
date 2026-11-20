const express = require("express");
const validate = require("../middlewares/validate.middleware");
const auth = require("../middlewares/auth.middleware");
const { signupSchema, loginSchema } = require("../validators/auth.validator");
const { signup, login, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", auth, me);

module.exports = router;