const { pool } = require('../config/db');

// Generate next sequential customer_id based on role prefix
async function generateCustomerId(role) {
  let prefix;
  switch (String(role).toUpperCase()) {
    case 'STUDENT': prefix = 'STU'; break;
    case 'TEACHER': prefix = 'TCH'; break;
    case 'GUEST': prefix = 'GST'; break;
    case 'LIBRARIAN': prefix = 'LIB'; break;
    default: prefix = 'USR';
  }

  const [rows] = await pool.query(
    `SELECT customer_id FROM users
     WHERE customer_id LIKE ? ORDER BY customer_id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const last = rows[0].customer_id;
    const numPart = parseInt(last.substring(prefix.length), 10);
    if (!isNaN(numPart)) nextNum = numPart + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// Generate a card number
function generateCardNumber(customerId) {
  return `HH-${customerId}-${Date.now().toString(36).toUpperCase()}`;
}

module.exports = { generateCustomerId, generateCardNumber };
