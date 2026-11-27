const db = require("../config/db");

/* PLANS */
const Plans = {
  async listActive() {
    const [rows] = await db.query(`SELECT id, duration_minutes, pre_amount, total_amount FROM counselling_plans WHERE is_active = 1 ORDER BY duration_minutes ASC`);
    return rows.map(Plans._row);
  },
  async listAll() {
    const [rows] = await db.query(`SELECT id, duration_minutes, pre_amount, total_amount, is_active FROM counselling_plans ORDER BY duration_minutes ASC`);
    return rows.map(Plans._row);
  },
  async findByDuration(duration) {
    const [rows] = await db.query(`SELECT id, duration_minutes, pre_amount, total_amount, is_active FROM counselling_plans WHERE duration_minutes = ? LIMIT 1`, [duration]);
    return rows.length ? Plans._row(rows[0]) : null;
  },
  async findById(id) {
    const [rows] = await db.query(`SELECT id, duration_minutes, pre_amount, total_amount, is_active FROM counselling_plans WHERE id = ? LIMIT 1`, [id]);
    return rows.length ? Plans._row(rows[0]) : null;
  },
  async upsert({ durationMinutes, preAmount, totalAmount, isActive }) {
    await db.query(
      `INSERT INTO counselling_plans (duration_minutes, pre_amount, total_amount, is_active) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE pre_amount = VALUES(pre_amount), total_amount = VALUES(total_amount), is_active = VALUES(is_active)`,
      [durationMinutes, preAmount, totalAmount, isActive ? 1 : 0]
    );
    return Plans.findByDuration(durationMinutes);
  },
  async remove(id) {
    await db.query("DELETE FROM counselling_plans WHERE id = ?", [id]);
  },
  _row(r) {
    return {
      id: r.id,
      durationMinutes: r.duration_minutes,
      preAmount: Number(r.pre_amount),
      totalAmount: Number(r.total_amount),
      remainingAmount: Number(r.total_amount) - Number(r.pre_amount),
      isActive: !!r.is_active,
    };
  },
};

/* QUESTIONS */
const Questions = {
  async listActive() {
    const [questions] = await db.query(`SELECT id, question_text, sort_order FROM counselling_questions WHERE is_active = 1 ORDER BY sort_order ASC`);
    if (questions.length === 0) return [];
    const [options] = await db.query(`SELECT id, question_id, label, image_url FROM counselling_options WHERE is_active = 1 ORDER BY sort_order ASC`);
    return questions.map(q => ({
      id: q.id,
      questionText: q.question_text,
      sortOrder: q.sort_order,
      options: options.filter(o => o.question_id === q.id).map(o => ({ id: o.id, label: o.label, imageUrl: o.image_url }))
    }));
  },
  async listAll() {
    const [questions] = await db.query(`SELECT * FROM counselling_questions ORDER BY sort_order ASC`);
    const [options] = await db.query(`SELECT * FROM counselling_options ORDER BY sort_order ASC`);
    return questions.map(q => ({
      id: q.id,
      questionText: q.question_text,
      options: options.filter(o => o.question_id === q.id)
    }));
  },
  async createQuestion({ questionText, sortOrder }) {
    const [res] = await db.query(`INSERT INTO counselling_questions (question_text, sort_order) VALUES (?, ?)`, [questionText, sortOrder || 0]);
    return { id: res.insertId, questionText, options: [] };
  },
  async updateQuestion(id, { questionText, sortOrder }) {
    const fields = [], values = [];
    if (questionText !== undefined) { fields.push("question_text = ?"); values.push(questionText); }
    if (sortOrder !== undefined) { fields.push("sort_order = ?"); values.push(sortOrder); }
    if (!fields.length) return null;
    values.push(id);
    await db.query(`UPDATE counselling_questions SET ${fields.join(", ")} WHERE id = ?`, values);
    return { id, questionText };
  },
  async createOption({ questionId, label, imageUrl, sortOrder }) {
    const [res] = await db.query(`INSERT INTO counselling_options (question_id, label, image_url, sort_order) VALUES (?, ?, ?, ?)`, [questionId, label, imageUrl, sortOrder || 0]);
    return { id: res.insertId, questionId, label, imageUrl };
  },
  async updateOption(id, { label, imageUrl, sortOrder }) {
    const fields = [], values = [];
    if (label !== undefined) { fields.push("label = ?"); values.push(label); }
    if (imageUrl !== undefined) { fields.push("image_url = ?"); values.push(imageUrl); }
    if (sortOrder !== undefined) { fields.push("sort_order = ?"); values.push(sortOrder); }
    if (!fields.length) return null;
    values.push(id);
    await db.query(`UPDATE counselling_options SET ${fields.join(", ")} WHERE id = ?`, values);
    return { id, label, imageUrl };
  },
  async removeQuestion(id) { await db.query("DELETE FROM counselling_questions WHERE id = ?", [id]); },
  async removeOption(id) { await db.query("DELETE FROM counselling_options WHERE id = ?", [id]); },
};

/* BOOKINGS */
const Bookings = {
  async create(data) {
    const [res] = await db.query(
      `INSERT INTO counselling_bookings (booking_code, user_id, plan_id, duration_minutes, answers, preferred_date, preferred_time, contact_name, contact_email, contact_phone, pre_amount, total_amount, remaining_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.bookingCode, data.userId, data.planId, data.durationMinutes, JSON.stringify(data.answers), data.preferredDate, data.preferredTime, data.contactName, data.contactEmail, data.contactPhone, data.preAmount, data.totalAmount, data.remainingAmount, data.status || "PENDING_PAYMENT"]
    );
    return Bookings.findById(res.insertId);
  },
  async findById(id) {
    const [rows] = await db.query(`SELECT * FROM counselling_bookings WHERE id = ? LIMIT 1`, [id]);
    return rows.length ? Bookings._row(rows[0]) : null;
  },
  async findByIdForUser(id, userId) {
    const [rows] = await db.query(`SELECT * FROM counselling_bookings WHERE id = ? AND user_id = ? LIMIT 1`, [id, userId]);
    return rows.length ? Bookings._row(rows[0]) : null;
  },
  async findByUser(userId) {
    const [rows] = await db.query(`SELECT * FROM counselling_bookings WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    return rows.map(Bookings._row);
  },
  async updateStatus(id, status) {
    await db.query(`UPDATE counselling_bookings SET status = ? WHERE id = ?`, [status, id]);
    return Bookings.findById(id);
  },
  async listAdmin({ from, to, page = 1, limit = 20 }) {
    const where = [], params = [];
    if (from) { where.push("b.created_at >= ?"); params.push(from); }
    if (to) { where.push("b.created_at <= ?"); params.push(to); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [countRows] = await db.query(`SELECT COUNT(*) AS n FROM counselling_bookings b ${whereSql}`, params);
    const total = Number(countRows[0].n);
    const offset = (page - 1) * limit;
    const [rows] = await db.query(
      `SELECT b.*, u.name AS user_name, u.email AS user_email FROM counselling_bookings b LEFT JOIN users u ON u.id = b.user_id ${whereSql} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { bookings: rows.map(Bookings._rowAdmin), total, page, limit };
  },
  async countByRange({ from, to }) {
    const where = [], params = [];
    if (from) { where.push("created_at >= ?"); params.push(from); }
    if (to) { where.push("created_at <= ?"); params.push(to); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await db.query(`SELECT COUNT(*) AS n FROM counselling_bookings ${whereSql}`, params);
    return Number(rows[0].n);
  },
  _row(r) {
    return {
      id: r.id, bookingCode: r.booking_code, userId: r.user_id, planId: r.plan_id,
      durationMinutes: r.duration_minutes,
      answers: r.answers ? (typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers) : {},
      preferredDate: r.preferred_date, preferredTime: r.preferred_time,
      contactName: r.contact_name, contactEmail: r.contact_email, contactPhone: r.contact_phone,
      preAmount: Number(r.pre_amount), totalAmount: Number(r.total_amount), remainingAmount: Number(r.remaining_amount),
      status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
    };
  },
  _rowAdmin(r) { return { ...Bookings._row(r), userName: r.user_name || null, userEmail: r.user_email || null }; },
};

/* PAYMENTS */
const Payments = {
  async create({ bookingId, type, amount, razorpayOrderId }) {
    const [res] = await db.query(`INSERT INTO counselling_payments (booking_id, type, amount, razorpay_order_id, status) VALUES (?, ?, ?, ?, 'CREATED')`, [bookingId, type, amount, razorpayOrderId]);
    return Payments.findById(res.insertId);
  },
  async findById(id) {
    const [rows] = await db.query(`SELECT * FROM counselling_payments WHERE id = ? LIMIT 1`, [id]);
    return rows.length ? Payments._row(rows[0]) : null;
  },
  async findByBookingAndType(bookingId, type) {
    const [rows] = await db.query(`SELECT * FROM counselling_payments WHERE booking_id = ? AND type = ? ORDER BY id DESC LIMIT 1`, [bookingId, type]);
    return rows.length ? Payments._row(rows[0]) : null;
  },
  async markPaid({ id, razorpayPaymentId, razorpaySignature }) {
    await db.query(`UPDATE counselling_payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'PAID' WHERE id = ?`, [razorpayPaymentId, razorpaySignature, id]);
    return Payments.findById(id);
  },
  _row(r) { return { id: r.id, bookingId: r.booking_id, type: r.type, amount: Number(r.amount), razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, status: r.status }; },
};

module.exports = { Plans, Questions, Bookings, Payments };