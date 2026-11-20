require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function setup() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  console.log("📄 Reading schema.sql ...");

  // Connect WITHOUT database first (database may not exist yet)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log("🔌 Connected to MySQL (server)");
    console.log("🛠  Running schema.sql (creates DB + tables) ...");

    await connection.query(sql);

    console.log("✅ Schema applied successfully");
    console.log(`   Database: ${process.env.DB_NAME}`);
  } catch (err) {
    console.error("❌ Schema failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setup();