const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hope_haven_library',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
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
