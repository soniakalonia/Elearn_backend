const pool = require("../config/db");

const AdminStats = {
  async revenueTotals() {
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS paid_orders
         FROM orders WHERE status = 'paid'`
    );
    return {
      revenue: Number(rows[0].revenue),
      paidOrders: Number(rows[0].paid_orders),
    };
  },

  async revenueByDay(days = 7) {
    const [rows] = await pool.execute(
      `SELECT DATE(created_at) AS d, COALESCE(SUM(total),0) AS amount
         FROM orders
        WHERE status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY d ASC`,
      [days]
    );
    return rows.map((r) => ({ date: String(r.d), amount: Number(r.amount) }));
  },

  async totalEnrollments() {
    const [rows] = await pool.execute("SELECT COUNT(*) AS n FROM enrollments");
    return Number(rows[0].n);
  },

  async recentEnrollments(limit = 5) {
    const [rows] = await pool.execute(
      `SELECT u.name AS user_name, u.email AS user_email,
              c.title AS course_title, e.created_at
         FROM enrollments e
         JOIN users u   ON u.id = e.user_id
         JOIN courses c ON c.id = e.course_id
        ORDER BY e.created_at DESC
        LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({
      userName: r.user_name,
      userEmail: r.user_email,
      courseTitle: r.course_title,
      createdAt: r.created_at,
    }));
  },
};

module.exports = AdminStats;