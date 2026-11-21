const db = require("../config/db");

function generateOrderCode() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EH-${datePart}-${rand}`;
}

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
    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );
    order.items = items.map((i) => ({
      id: i.id,
      courseId: i.course_id,
      title: i.title,
      price: Number(i.price),
    }));
    return order;
  },

  /**
   * Create a new order.
   * Accepts an optional `conn` — when provided, the caller controls the transaction.
   */
  async create(
    {
      userId,
      items,
      subtotal,
      discount = 0,
      total,
      status = "pending",
      paymentMethod = null,
      paymentRef = null,
      country = null,
      razorpayOrderId = null,
      razorpayPaymentId = null,
      razorpaySignature = null,
    },
    conn = null
  ) {
    const runner = conn || db;
    const code = generateOrderCode();

    const [res] = await runner.query(
      `INSERT INTO orders
        (user_id, order_code, subtotal, discount, total, status, payment_method, payment_ref,
         country, razorpay_order_id, razorpay_payment_id, razorpay_signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        code,
        subtotal,
        discount,
        total,
        status,
        paymentMethod,
        paymentRef,
        country,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      ]
    );

    const orderId = res.insertId;

    for (const item of items) {
      await runner.query(
        `INSERT INTO order_items (order_id, course_id, title, price) VALUES (?, ?, ?, ?)`,
        [orderId, item.courseId, item.title, item.price]
      );
    }

    return Order.findById(orderId);
  },

  async attachRazorpayOrderId(orderId, razorpayOrderId) {
    await db.query(`UPDATE orders SET razorpay_order_id = ? WHERE id = ?`, [
      razorpayOrderId,
      orderId,
    ]);
  },

  async findByIdForUser(orderId, userId) {
    const [rows] = await db.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
      [orderId, userId]
    );
    return rows[0] || null;
  },

  /**
   * Mark order paid + return updated row. Must be called inside a transaction.
   */
  async markPaid(
    {
      orderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod = "razorpay",
    },
    conn
  ) {
    const runner = conn || db;
    await runner.query(
      `UPDATE orders
          SET status = 'paid',
              payment_method = ?,
              payment_ref = ?,
              razorpay_payment_id = ?,
              razorpay_signature = ?
        WHERE id = ? AND status = 'pending'`,
      [
        paymentMethod,
        razorpayPaymentId,
        razorpayPaymentId,
        razorpaySignature,
        orderId,
      ]
    );
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
      country: r.country,
      razorpayOrderId: r.razorpay_order_id,
      razorpayPaymentId: r.razorpay_payment_id,
      createdAt: r.created_at,
      itemCount: Number(r.item_count || 0),
      itemsSummary: r.items_summary || "",
    };
  },
};

module.exports = Order;