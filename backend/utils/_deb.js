const { pool } = require('../config/db');
(async () => {
  const [books] = await pool.query(`
    SELECT b.id, b.title, b.available_copies, b.total_copies,
      (SELECT COUNT(*) FROM book_copies c WHERE c.book_id = b.id AND c.status IN ('BORROWED','OVERDUE')) AS active_copies
    FROM books b ORDER BY b.id`);
  console.log('BOOKS:');
  books.forEach(x => console.log(`  #${x.id} ${x.title} [avail ${x.available_copies}/${x.total_copies}] activeCopies=${x.active_copies}`));
  const [active] = await pool.query(`
    SELECT l.id, l.customer_code, l.user_id, c.copy_code, c.book_id, b.title, l.status
    FROM borrowings l
    JOIN book_copies c ON c.id = l.book_copy_id
    JOIN books b ON b.id = c.book_id
    JOIN users u ON u.id = l.user_id
    WHERE l.status IN ('BORROWED','OVERDUE')`);
  console.log('ACTIVE BORROWS:', active.length);
  active.forEach(x => console.log(`  ${x.copy_code} (book #${x.book_id}) ${x.title} | status=${x.status} | by ${x.customer_code || x.user_id}`));
  const [fks] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME = 'book_copies' OR REFERENCED_TABLE_NAME = 'books'`);
  console.log('FKs referencing books/book_copies:', JSON.stringify(fks));
  const [qr] = await pool.query(`SELECT COUNT(*) AS n FROM qrcodes
    WHERE book_copy_id NOT IN (SELECT id FROM book_copies) OR book_id NOT IN (SELECT id FROM books)`);
  console.log('orphan qrcodes:', qr[0].n);
  await pool.end();
})();