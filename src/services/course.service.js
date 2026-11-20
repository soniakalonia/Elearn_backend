const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const publicCourse = (c) => ({
  id: c.id,
  title: c.title,
  shortDescription: c.short_description,
  description: c.description,
  objectives: c.objectives,
  categoryId: c.category_id,
  categoryName: c.category_name,
  originalPrice: Number(c.original_price),
  discountPrice: Number(c.discount_price),
  status: c.status,
  imageUrl: c.image_url,
  offerText: c.offer_text,
  courseLength: c.course_length,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

async function listCourses({ includeAll = false, categoryId, search } = {}) {
  const where = [];
  const params = [];
  if (!includeAll) where.push("c.status = 'live'");
  if (categoryId) { where.push("c.category_id = ?"); params.push(Number(categoryId)); }
  if (search && search.trim()) {
    where.push("(c.title LIKE ? OR c.short_description LIKE ?)");
    const like = `%${search.trim()}%`;
    params.push(like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `SELECT c.*, cat.name AS category_name
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     ${whereSql}
     ORDER BY c.created_at DESC`,
    params
  );
  return rows.map(publicCourse);
}

async function getCourse(id) {
  const [rows] = await pool.execute(
    `SELECT c.*, cat.name AS category_name
     FROM courses c
     JOIN categories cat ON cat.id = c.category_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Course not found");
  return publicCourse(rows[0]);
}

async function createCourse(body) {
  const {
    title, shortDescription, description, objectives, categoryId,
    originalPrice, discountPrice, status, imageUrl, offerText, courseLength,
  } = body;
  if (!title || !title.trim()) throw new ApiError(400, "Title is required");
  if (!categoryId) throw new ApiError(400, "Category is required");

  const [cat] = await pool.execute("SELECT id FROM categories WHERE id = ? LIMIT 1", [categoryId]);
  if (!cat[0]) throw new ApiError(400, "Category does not exist");

  const validStatus = ["draft", "live", "paused"].includes(status) ? status : "draft";

  const [result] = await pool.execute(
    `INSERT INTO courses
      (title, short_description, description, objectives, category_id, original_price, discount_price, status, image_url, offer_text, course_length)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      (shortDescription || "").trim(),
      (description || "").trim(),
      (objectives || "").trim(),
      Number(categoryId),
      Number(originalPrice) || 0,
      Number(discountPrice) || 0,
      validStatus,
      imageUrl || null,
      offerText || null,
      courseLength || null,
    ]
  );
  return getCourse(result.insertId);
}

async function updateCourse(id, patch) {
  await getCourse(id);
  const fields = [];
  const params = [];
  const map = {
    title: "title",
    shortDescription: "short_description",
    description: "description",
    objectives: "objectives",
    categoryId: "category_id",
    originalPrice: "original_price",
    discountPrice: "discount_price",
    status: "status",
    imageUrl: "image_url",
    offerText: "offer_text",
    courseLength: "course_length",
  };
  for (const [key, col] of Object.entries(map)) {
    if (patch[key] !== undefined) {
      fields.push(`${col} = ?`);
      params.push(patch[key]);
    }
  }
  if (!fields.length) throw new ApiError(400, "Nothing to update");
  params.push(id);
  await pool.execute(`UPDATE courses SET ${fields.join(", ")} WHERE id = ?`, params);
  return getCourse(id);
}

async function deleteCourse(id) {
  const [result] = await pool.execute("DELETE FROM courses WHERE id = ?", [id]);
  if (!result.affectedRows) throw new ApiError(404, "Course not found");
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };