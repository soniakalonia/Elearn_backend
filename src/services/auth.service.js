const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  avatar: u.avatar,
  isVerified: !!u.is_verified,
});

async function register({ name, email, phone, password }) {
  const normalized = email.trim().toLowerCase();

  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalized]
  );
  if (existing.length) throw new ApiError(409, "Email already registered");

  const hash = await hashPassword(password);
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, phone, password, role, is_verified, is_active) VALUES (?, ?, ?, ?, 'user', 0, 1)",
    [name.trim(), normalized, phone || null, hash]
  );

  const [rows] = await pool.execute(
    "SELECT id, name, email, phone, role, avatar, is_verified FROM users WHERE id = ?",
    [result.insertId]
  );
  const user = rows[0];
  const token = signToken({ id: user.id, role: user.role });
  return { user: publicUser(user), token };
}

async function login({ email, password }) {
  const normalized = email.trim().toLowerCase();

  const [rows] = await pool.execute(
    "SELECT id, name, email, phone, password, role, avatar, is_verified, is_active FROM users WHERE email = ? LIMIT 1",
    [normalized]
  );
  const user = rows[0];
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (!user.is_active) throw new ApiError(403, "Account is disabled");

  const ok = await comparePassword(password, user.password);
  if (!ok) throw new ApiError(401, "Invalid email or password");

  await pool.execute(
    "UPDATE users SET last_login_at = NOW() WHERE id = ?",
    [user.id]
  );

  const token = signToken({ id: user.id, role: user.role });
  return { user: publicUser(user), token };
}

async function me(userId) {
  const [rows] = await pool.execute(
    "SELECT id, name, email, phone, role, avatar, is_verified FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  if (!rows[0]) throw new ApiError(404, "User not found");
  return publicUser(rows[0]);
}

module.exports = { register, login, me };