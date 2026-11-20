const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const pool = require("./config/db");

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    logger.info("MySQL connected");
  } catch (err) {
    logger.error("MySQL connection failed:", err.message);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
  });
})();