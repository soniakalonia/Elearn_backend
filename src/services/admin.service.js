const User = require("../models/User");
const Course = require("../models/Course");
const AdminStats = require("../models/AdminStats");

const adminService = {
  async getStats() {
    const [
      revenue, revenueByDay, activeLearners, newSignups,
      liveCourses, totalCourses, enrollments,
      topCourses, recentEnrollments,
    ] = await Promise.all([
      AdminStats.revenueTotals(),
      AdminStats.revenueByDay(7),
      User.countActive(),
      User.countNewByDay(30),
      Course.countLive(),
      Course.countAll(),
      AdminStats.totalEnrollments(),
      Course.topByEnrollments(5),
      AdminStats.recentEnrollments(5),
    ]);

    // Fill 7-day gaps so the chart always has 7 bars
    const revFilled = fillDays(revenueByDay, 7, { amount: 0 });
    const signFilled = fillDays(newSignups, 30, { count: 0 });

    return {
      totals: {
        revenue: revenue.revenue,
        paidOrders: revenue.paidOrders,
        activeLearners,
        liveCourses,
        totalCourses,
        totalEnrollments: enrollments,
      },
      revenueLast7Days: revFilled,
      signupsLast30Days: signFilled,
      topCourses,
      recentEnrollments,
    };
  },
};

function fillDays(rows, days, zeroShape) {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) || { date: key, ...zeroShape });
  }
  return out;
}

module.exports = adminService;