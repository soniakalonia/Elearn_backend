const pool = require("../config/db");

const Course = {
  async countLive() {
    const [rows] = await pool.execute("SELECT COUNT(*) AS n FROM courses WHERE status = 'live'");
    return Number(rows[0].n);
  },

  async countAll() {
    const [rows] = await pool.execute("SELECT COUNT(*) AS n FROM courses");
    return Number(rows[0].n);
  },

  async topByEnrollments(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT c.id, c.title, COUNT(e.id) AS n
         FROM courses c
         LEFT JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.id, c.title
        ORDER BY n DESC, c.created_at DESC
        LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({ id: r.id, title: r.title, enrollments: Number(r.n) }));
  },
};

module.exports = Course;