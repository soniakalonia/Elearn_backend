const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/db");

const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Not authenticated");

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const [rows] = await pool.execute(
    "SELECT id, name, email, phone, role, avatar, is_verified, is_active FROM users WHERE id = ? LIMIT 1",
    [decoded.id]
  );
  const user = rows[0];
  if (!user) throw new ApiError(401, "User no longer exists");
  if (!user.is_active) throw new ApiError(403, "Account is disabled");

  req.user = user;
  next();
});

module.exports = auth;