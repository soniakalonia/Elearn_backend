const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

async function listCart(userId) {
  const [rows] = await pool.execute(
    `SELECT ci.id, ci.course_id AS courseId, c.title, c.discount_price AS price, c.image_url AS imageUrl
     FROM cart_items ci
     JOIN courses c ON c.id = ci.course_id
     WHERE ci.user_id = ?
     ORDER BY ci.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({ ...r, price: Number(r.price) }));
}

async function addToCart(userId, courseId) {
  const [course] = await pool.execute("SELECT id FROM courses WHERE id = ? LIMIT 1", [courseId]);
  if (!course[0]) throw new ApiError(404, "Course not found");

  await pool.execute(
    "INSERT IGNORE INTO cart_items (user_id, course_id) VALUES (?, ?)",
    [userId, courseId]
  );
  return listCart(userId);
}

async function removeFromCart(userId, courseId) {
  await pool.execute(
    "DELETE FROM cart_items WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  return listCart(userId);
}

async function clearCart(userId, conn = null) {
  const runner = conn || pool;
  await runner.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
}

module.exports = { listCart, addToCart, removeFromCart, clearCart };