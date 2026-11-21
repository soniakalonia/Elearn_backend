const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  DB: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",

  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID,
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || null,
  },
};