const pool = require("../config/db");
const ApiError = require("../utils/ApiError");

const publicCategory = (c) => ({
  id: c.id,
  name: c.name,
  shortHeading: c.short_heading,
  description: c.description,
  sortOrder: c.sort_order,
  isActive: !!c.is_active,
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

async function listCategories({ includeInactive = false } = {}) {
  const where = includeInactive ? "" : "WHERE is_active = 1";
  const [rows] = await pool.execute(
    `SELECT id, name, short_heading, description, sort_order, is_active, created_at, updated_at
     FROM categories ${where}
     ORDER BY sort_order ASC, id ASC`
  );
  return rows.map(publicCategory);
}

async function getCategory(id) {
  const [rows] = await pool.execute("SELECT * FROM categories WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) throw new ApiError(404, "Category not found");
  return publicCategory(rows[0]);
}

async function createCategory({ name, shortHeading, description, sortOrder }) {
  if (!name || !name.trim()) throw new ApiError(400, "Category name is required");
  if (!description || !description.trim()) throw new ApiError(400, "Category description is required");

  const [result] = await pool.execute(
    `INSERT INTO categories (name, short_heading, description, sort_order, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name.trim(), (shortHeading || "").trim(), description.trim(), Number(sortOrder) || 0]
  );
  return getCategory(result.insertId);
}

async function updateCategory(id, patch) {
  await getCategory(id);
  const fields = [];
  const params = [];
  if (patch.name !== undefined)         { fields.push("name = ?");          params.push(patch.name.trim()); }
  if (patch.shortHeading !== undefined) { fields.push("short_heading = ?"); params.push((patch.shortHeading || "").trim()); }
  if (patch.description !== undefined)  { fields.push("description = ?");   params.push((patch.description || "").trim()); }
  if (patch.sortOrder !== undefined)    { fields.push("sort_order = ?");    params.push(Number(patch.sortOrder) || 0); }
  if (patch.isActive !== undefined)     { fields.push("is_active = ?");     params.push(patch.isActive ? 1 : 0); }

  if (!fields.length) throw new ApiError(400, "Nothing to update");
  params.push(id);
  await pool.execute(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`, params);
  return getCategory(id);
}

async function deleteCategory(id) {
  const [courses] = await pool.execute(
    "SELECT COUNT(*) AS n FROM courses WHERE category_id = ?",
    [id]
  );
  if (courses[0].n > 0) {
    throw new ApiError(400, "Cannot delete: courses exist in this category");
  }
  const [result] = await pool.execute("DELETE FROM categories WHERE id = ?", [id]);
  if (!result.affectedRows) throw new ApiError(404, "Category not found");
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};