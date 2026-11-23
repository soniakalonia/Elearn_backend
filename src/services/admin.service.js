const db = require("../config/db");
const AdminStats = require("../models/AdminStats");
const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");

const adminService = {
  async getStats({ startDate, endDate }) {
    // 1. Calculate totals for the filtered date range
    const [revenueData] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS paidOrders
       FROM orders 
       WHERE status = 'paid' AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 2. Active learners (users with at least 1 enrollment in this period)
    const [activeLearnersData] = await db.query(
      `SELECT COUNT(DISTINCT user_id) AS activeLearners 
       FROM enrollments 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 3. Revenue trend for the last 7 days (always last 7 days for the chart)
    const trendEnd = new Date();
    const trendStart = new Date();
    trendStart.setDate(trendEnd.getDate() - 7);
    const [revenueTrendRows] = await db.query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(total), 0) AS amount
       FROM orders
       WHERE status = 'paid' AND created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [trendStart, trendEnd]
    );

    // 4. Fill missing days for the chart
    const filledTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = revenueTrendRows.find((r) => new Date(r.date).toISOString().slice(0, 10) === key);
      filledTrend.push({ date: key, amount: found ? Number(found.amount) : 0 });
    }

    return {
      totals: {
        revenue: Number(revenueData[0]?.revenue || 0),
        paidOrders: revenueData[0]?.paidOrders || 0,
        activeLearners: activeLearnersData[0]?.activeLearners || 0,
        liveCourses: await Course.countLive(),
        totalCourses: await Course.countAll(),
        totalEnrollments: await AdminStats.totalEnrollments(),
      },
      revenueLast7Days: filledTrend,
      signupsLast30Days: await User.countNewByDay(30),
      topCourses: await Course.topByEnrollments(5),
      recentEnrollments: await AdminStats.recentEnrollments(5),
    };
  },

  async listOrders({ page, limit, startDate, endDate }) {
    const offset = (page - 1) * limit;
    const params = [startDate, endDate];
    
    // Get total count
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM orders WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    const total = countRows[0].total;

    // Get paginated data
    const [rows] = await db.query(
      `SELECT o.id, o.order_code, o.total, o.payment_method, o.created_at, u.name AS user_name, oi.title AS course_title
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.created_at BETWEEN ? AND ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return { orders: rows, total, page, limit };
  }
};

module.exports = adminService;

