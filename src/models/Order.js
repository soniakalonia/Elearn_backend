const db = require("../config/db");

const Order = {
  async findByUser(userId, limit = null) {
    const params = [userId];
    let sql = `SELECT o.*,
                      COUNT(oi.id) AS item_count,
                      GROUP_CONCAT(oi.title SEPARATOR ', ') AS items_summary
                 FROM orders o
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE o.user_id = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC`;
    if (limit) {
      sql += " LIMIT ?";
      params.push(Number(limit));
    }
    const [rows] = await db.query(sql, params);
    return rows.map(Order._row);
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT o.*,
              COUNT(oi.id) AS item_count,
              GROUP_CONCAT(oi.title SEPARATOR ', ') AS items_summary
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.id = ?
        GROUP BY o.id`,
      [id]
    );
    if (!rows.length) return null;
    const order = Order._row(rows[0]);
    const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [id]);
    order.items = items.map((i) => ({ id: i.id, courseId: i.course_id, title: i.title, price: Number(i.price) }));
    return order;
  },

  async create({ userId, items, subtotal, discount, total, paymentMethod, paymentRef }) {
    const code = `EH-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [res] = await db.query(
      `INSERT INTO orders (user_id, order_code, subtotal, discount, total, status, payment_method, payment_ref)
       VALUES (?, ?, ?, ?, ?, 'paid', ?, ?)`,
      [userId, code, subtotal, discount, total, paymentMethod || "manual", paymentRef || null]
    );
    const orderId = res.insertId;
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, course_id, title, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.courseId, item.title, item.price]
      );
    }
    return Order.findById(orderId);
  },

  _row(r) {
    return {
      id: r.id,
      userId: r.user_id,
      orderCode: r.order_code,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      total: Number(r.total),
      currency: r.currency,
      status: r.status,
      paymentMethod: r.payment_method,
      paymentRef: r.payment_ref,
      createdAt: r.created_at,
      itemCount: Number(r.item_count || 0),
      itemsSummary: r.items_summary || "",
    };
  },
};

module.exports = Order;