const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;