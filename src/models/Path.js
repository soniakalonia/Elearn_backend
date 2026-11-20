const db = require("../config/db");

const Path = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name
         FROM paths p
         LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.created_at DESC`
    );
    return rows.map(Path._row);
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name
         FROM paths p
         LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = ?`,
      [id]
    );
    return rows.length ? Path._row(rows[0]) : null;
  },

  async create(data) {
    const [res] = await db.query(
      `INSERT INTO paths
         (title, description, image_url, duration, level, skills, outcomes, steps, category_id)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.imageUrl || null,
        data.duration || null,
        data.level || null,
        JSON.stringify(data.skills || []),
        data.outcomes || null,
        data.steps || null,
        data.categoryId || null,
      ]
    );
    return Path.findById(res.insertId);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const map = {
      title: "title",
      description: "description",
      imageUrl: "image_url",
      duration: "duration",
      level: "level",
      outcomes: "outcomes",
      steps: "steps",
      categoryId: "category_id",
    };
    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }
    if (data.skills !== undefined) {
      fields.push(`skills = CAST(? AS JSON)`);
      values.push(JSON.stringify(data.skills));
    }
    if (!fields.length) return Path.findById(id);

    values.push(id);
    await db.query(`UPDATE paths SET ${fields.join(", ")} WHERE id = ?`, values);
    return Path.findById(id);
  },

  async remove(id) {
    const [res] = await db.query("DELETE FROM paths WHERE id = ?", [id]);
    return res.affectedRows > 0;
  },

  _row(r) {
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.image_url,
      duration: r.duration,
      level: r.level,
      skills: typeof r.skills === "string" ? JSON.parse(r.skills || "[]") : r.skills || [],
      outcomes: r.outcomes || "",
      steps: r.steps || "",
      categoryId: r.category_id,
      categoryName: r.category_name || "General",
    };
  },
};

module.exports = Path;