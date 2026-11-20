const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seed() {
  let connection;
  try {
    console.log("Starting database seeding...");

    const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"];
    for (const key of requiredEnv) {
      if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("MySQL connected successfully!");

    const adminName = process.env.ADMIN_NAME || "Admin";
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE || null;

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await connection.execute(
      `INSERT INTO users (name, email, phone, password, role, is_verified, is_active)
       VALUES (?, ?, ?, ?, 'admin', 1, 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         phone = VALUES(phone),
         password = VALUES(password),
         role = 'admin',
         is_verified = 1,
         is_active = 1`,
      [adminName, adminEmail, adminPhone, hashedPassword]
    );

    console.log("ADMIN SEEDED SUCCESSFULLY!");
    console.log("Admin Email:", adminEmail);
    console.log("Admin Role: admin");
    console.log("Password: Securely hashed");
    console.log("No categories/courses seeded — add them from the Admin console.");
  } catch (error) {
    console.error("Database seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

seed();