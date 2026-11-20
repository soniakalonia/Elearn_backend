const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  if (status >= 500) logger.error?.(err.stack || message);

  res.status(status).json({
    success: false,
    statusCode: status,
    message,
  });
};

module.exports = errorHandler;