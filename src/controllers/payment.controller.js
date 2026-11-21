const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const pool = require("../config/db");
const Cart = require("../services/cart.service");
const Order = require("../models/Order");
const { getProvider } = require("../services/payment/payment.factory");

/**
 * POST /api/payments/razorpay/create
 * Body: { name, email, phone, country }
 * Reads the cart from DB, creates a pending order, then a Razorpay order.
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { name, email, phone, country } = req.body;
  const userId = req.user.id;

  // 1. Read cart from DB (never trust client prices)
  const items = await Cart.listCart(userId);
  if (!items.length) throw new ApiError(400, "Your cart is empty");

  const subtotal = items.reduce((s, it) => s + Number(it.price), 0);
  if (subtotal <= 0) throw new ApiError(400, "Invalid cart total");

  // 2. Create pending order in DB
  const order = await Order.create({
    userId,
    items: items.map((it) => ({
      courseId: it.courseId,
      title: it.title,
      price: Number(it.price),
    })),
    subtotal,
    discount: 0,
    total: subtotal,
    status: "pending",
    paymentMethod: "razorpay",
    country: country || "India",
  });

  // 3. Create Razorpay order
  const provider = getProvider("razorpay");
  const rzpOrder = await provider.createOrder({
    amountInPaise: Math.round(subtotal * 100),
    receipt: order.orderCode,
    notes: {
      orderId: String(order.id),
      userId: String(userId),
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
    },
  });

  // 4. Save the Razorpay order id back on the order
  await Order.attachRazorpayOrderId(order.id, rzpOrder.id);

  // 5. Return everything the frontend needs to open the modal
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        orderId: order.id,
        orderCode: order.orderCode,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: env.RAZORPAY.KEY_ID,
        prefill: { name, email, contact: phone },
        notes: rzpOrder.notes,
      },
      "Razorpay order created"
    )
  );
});

/**
 * POST /api/payments/razorpay/verify
 * Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies signature, then marks order paid + enrolls + clears cart atomically.
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  // 1. Load the order
  const order = await Order.findByIdForUser(orderId, userId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "paid") {
    return res.status(200).json(
      new ApiResponse(200, { orderId: order.id, status: "paid", alreadyPaid: true }, "Already paid")
    );
  }
  if (order.status !== "pending") {
    throw new ApiError(400, `Order is not payable (status: ${order.status})`);
  }
  if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
    throw new ApiError(400, "Razorpay order mismatch");
  }

  // 2. Verify signature
  const provider = getProvider("razorpay");
  const ok = provider.verifySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });
  if (!ok) {
    throw new ApiError(400, "Payment signature verification failed");
  }

  // 3. Transactional: mark paid + enroll + clear cart
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await Order.markPaid(
      {
        orderId: order.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod: "razorpay",
      },
      conn
    );

    // Create enrollments for each order item (idempotent)
    const [items] = await conn.query(
      "SELECT course_id FROM order_items WHERE order_id = ?",
      [order.id]
    );
    for (const it of items) {
      await conn.query(
        `INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)`,
        [userId, it.course_id]
      );
    }

    // Clear the cart
    await Cart.clearCart(userId, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: order.id,
        orderCode: order.order_code,
        status: "paid",
        total: Number(order.total),
      },
      "Payment verified"
    )
  );
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment };