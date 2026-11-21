const db = require("../config/db");

const Enrollment = {
  async findByUser(userId) {
    const [rows] = await db.query(
      `SELECT e.*,
              c.title AS course_title, c.image_url AS course_image,
              c.course_length, c.category_id,
              cat.name AS category_name
         FROM enrollments e
         JOIN courses c   ON c.id = e.course_id
         LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE e.user_id = ?
        ORDER BY e.last_accessed_at DESC, e.updated_at DESC`,
      [userId]
    );
    return rows.map(Enrollment._row);
  },

  async findOne(userId, courseId) {
    const [rows] = await db.query(
      `SELECT e.*,
              c.title AS course_title, c.image_url AS course_image,
              c.course_length, c.category_id,
              cat.name AS category_name
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE e.user_id = ? AND e.course_id = ?`,
      [userId, courseId]
    );
    return rows.length ? Enrollment._row(rows[0]) : null;
  },

  async create({ userId, courseId }) {
    const [res] = await db.query(
      `INSERT INTO enrollments (user_id, course_id, progress, last_accessed_at)
       VALUES (?, ?, 0, NOW())`,
      [userId, courseId]
    );
    return Enrollment.findOne(userId, courseId) || { id: res.insertId };
  },

  async updateProgress(userId, courseId, { progress, lastLesson }) {
    const fields = [];
    const values = [];
    if (progress !== undefined) {
      fields.push("progress = ?");
      values.push(Math.max(0, Math.min(100, Number(progress))));
      if (Number(progress) >= 100) fields.push("completed_at = COALESCE(completed_at, NOW())");
    }
    if (lastLesson !== undefined) {
      fields.push("last_lesson = ?");
      values.push(lastLesson);
    }
    fields.push("last_accessed_at = NOW()");
    values.push(userId, courseId);
    await db.query(
      `UPDATE enrollments SET ${fields.join(", ")} WHERE user_id = ? AND course_id = ?`,
      values
    );
    return Enrollment.findOne(userId, courseId);
  },

  async statsForUser(userId) {
    const [rows] = await db.query(
      `SELECT
         COUNT(*)                                             AS total,
         SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END)     AS completed,
         COALESCE(SUM(progress), 0)                           AS progress_sum
       FROM enrollments WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || { total: 0, completed: 0, progress_sum: 0 };
  },

  _row(r) {
    return {
      id: r.id,
      userId: r.user_id,
      courseId: r.course_id,
      progress: r.progress,
      lastLesson: r.last_lesson,
      lastAccessedAt: r.last_accessed_at,
      completedAt: r.completed_at,
      courseTitle: r.course_title,
      courseImage: r.course_image,
      courseLength: r.course_length,
      categoryId: r.category_id,
      categoryName: r.category_name,
    };
  },
};

module.exports = Enrollment;