const pool = require("../config/db");

const User = {
  async countActive() {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'user' AND is_active = 1"
    );
    return Number(rows[0].n);
  },

  async countNewByDay(days = 30) {
    const [rows] = await pool.execute(
      `SELECT DATE(created_at) AS d, COUNT(*) AS n
         FROM users
        WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY d ASC`,
      [days]
    );
    return rows.map((r) => ({ date: String(r.d), count: Number(r.n) }));
  },

  async countAll() {
    const [rows] = await pool.execute("SELECT COUNT(*) AS n FROM users WHERE role = 'user'");
    return Number(rows[0].n);
  },
};

module.exports = User;