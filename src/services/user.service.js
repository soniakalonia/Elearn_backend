const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.avatar,
  isVerified: !!u.is_verified,
  isActive: !!u.is_active,
  lastLoginAt: u.last_login_at,
  createdAt: u.created_at,
});

async function listUsers({ page = 1, limit = 20, search = "", role }) {
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];

  if (search) {
    where.push("(name LIKE ? OR email LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }
  if (role === "user" || role === "admin") {
    where.push("role = ?");
    params.push(role);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users ${whereSql}`,
    params
  );

  const [rows] = await pool.execute(
    `SELECT id, name, email, phone, role, avatar, is_verified, is_active, last_login_at, created_at
     FROM users ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    users: rows.map(publicUser),
    total: countRows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
}

async function setActive(userId, isActive) {
  const [result] = await pool.execute(
    "UPDATE users SET is_active = ? WHERE id = ?",
    [isActive ? 1 : 0, userId]
  );
  if (!result.affectedRows) throw new ApiError(404, "User not found");

  const [rows] = await pool.execute(
    "SELECT id, name, email, phone, role, avatar, is_verified, is_active, last_login_at, created_at FROM users WHERE id = ?",
    [userId]
  );
  return publicUser(rows[0]);
}

module.exports = { listUsers, setActive };