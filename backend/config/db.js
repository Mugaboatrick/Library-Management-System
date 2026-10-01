const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Connection pool sizing is env-configurable so the library can grow with demand.
// - connectionLimit: max simultaneous DB connections (raise as concurrent users grow)
// - waitForConnections: queue requests when the pool is exhausted instead of erroring
// - queueLimit: 0 = unlimited queue depth (no request is ever dropped)
// - keepAliveInitialDelay: probe idle connections so MySQL doesn't close them silently
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hope_haven_library',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || 30, 10),
  queueLimit: 0,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  namedPlaceholders: true
});

// Test connection function (used at server startup)
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✔ MySQL connected successfully');
    conn.release();
    return true;
  } catch (err) {
    console.error('✘ MySQL connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
