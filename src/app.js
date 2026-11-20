const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const env = require("./config/env");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const ApiError = require("./utils/ApiError");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Serve uploaded images
app.use("/uploads", express.static(path.resolve(__dirname, "../", env.UPLOAD_DIR)));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((req, res, next) => next(new ApiError(404, "Route not found")));
app.use(errorHandler);

module.exports = app;