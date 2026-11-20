const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

async function listWishlist(userId) {
  const [rows] = await pool.execute(
    `SELECT wi.course_id AS courseId
     FROM wishlist_items wi
     WHERE wi.user_id = ?
     ORDER BY wi.created_at DESC`,
    [userId]
  );
  return rows.map((r) => r.courseId);
}

async function toggleWishlist(userId, courseId) {
  const [course] = await pool.execute("SELECT id FROM courses WHERE id = ? LIMIT 1", [courseId]);
  if (!course[0]) throw new ApiError(404, "Course not found");

  const [existing] = await pool.execute(
    "SELECT id FROM wishlist_items WHERE user_id = ? AND course_id = ? LIMIT 1",
    [userId, courseId]
  );
  if (existing[0]) {
    await pool.execute("DELETE FROM wishlist_items WHERE id = ?", [existing[0].id]);
    return { added: false, courseIds: await listWishlist(userId) };
  }
  await pool.execute(
    "INSERT INTO wishlist_items (user_id, course_id) VALUES (?, ?)",
    [userId, courseId]
  );
  return { added: true, courseIds: await listWishlist(userId) };
}

module.exports = { listWishlist, toggleWishlist };