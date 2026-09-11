const { pool } = require('../config/db');

// Add a new book with copies
exports.addBook = async (req, res) => {
  try {
    const { title, author, category = 'General', publisher, publish_year, shelf_location, copies = 1, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, publisher, publish_year, shelf_location, total_copies, available_copies, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author || null, category, publisher || null, publish_year || null, shelf_location || null, parseInt(copies) || 1, parseInt(copies) || 1, description || null]
    );

    const bookId = result.insertId;

    // Create copies
    let copyParams = [];
    for (let i = 0; i < parseInt(copies); i++) {
      const code = `BOOK${String(bookId).padStart(3, '0')}-C${i + 1}`;
      copyParams.push([bookId, code, 'AVAILABLE']);
    }
    if (copyParams.length) {
      await pool.query('INSERT INTO book_copies (book_id, copy_code, status) VALUES ?', [copyParams]);
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_ADDED', 'BOOK', ?, ?)`,
      [req.user.id, bookId, `${title}, ${copies} copies`]
    );

    res.status(201).json({ success: true, message: 'Book added successfully', book_id: bookId });
  } catch (err) {
    console.error('Add book error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// List books with filters + search
exports.listBooks = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (search) {
      where.push('(b.title LIKE ? OR b.author LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (category) { where.push('b.category = ?'); params.push(category); }
    if (status) { where.push('b.status = ?'); params.push(String(status).toUpperCase()); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM books b ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id) AS total_copies,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'AVAILABLE') AS available,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'BORROWED') AS borrowed,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'RETIRED') AS retired
       FROM books b
       ${whereClause}
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total: count?.total || 0, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error('List books error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single book with copies
exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });

    const [copies] = await pool.query(
      `SELECT bc.*, (SELECT b.id FROM borrowings b WHERE b.copy_id = bc.id AND b.status IN ('BORROWED','OVERDUE')) AS current_loan
       FROM book_copies bc WHERE bc.book_id = ?`, [id]
    );

    res.json({ success: true, book: rows[0], copies });
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, publisher, publish_year, shelf_location, description } = req.body;

    const [exist] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });

    await pool.query(
      `UPDATE books SET title = COALESCE(?, title),
        author = COALESCE(?, author), category = COALESCE(?, category),
        publisher = COALESCE(?, publisher), publish_year = COALESCE(?, publish_year),
        shelf_location = COALESCE(?, shelf_location), description = COALESCE(?, description)
       WHERE id = ?`,
      [title, author, category, publisher, publish_year, shelf_location, description, id]
    );

    res.json({ success: true, message: 'Book updated' });
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add more copies to existing book
exports.addCopies = async (req, res) => {
  try {
    const { id } = req.params;
    const { copies = 1 } = req.body;

    const [exist] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });

    const bookId = parseInt(id);
    const [[maxCopy]] = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(copy_code, -1) AS UNSIGNED)) AS maxn FROM book_copies WHERE book_id = ?`,
      [bookId]
    );

    let start = (maxCopy?.maxn || 0) + 1;
    let copyParams = [];
    for (let i = 0; i < parseInt(copies); i++) {
      const code = `BOOK${String(bookId).padStart(3, '0')}-C${start + i}`;
      copyParams.push([bookId, code, 'AVAILABLE']);
    }

    await pool.query('INSERT INTO book_copies (book_id, copy_code, status) VALUES ?', [copyParams]);

    // Update totals
    await pool.query(
      `UPDATE books SET total_copies = total_copies + ?, available_copies = available_copies + ? WHERE id = ?`,
      [parseInt(copies), parseInt(copies), bookId]
    );

    res.json({ success: true, message: `${copies} copy(ies) added` });
  } catch (err) {
    console.error('Add copies error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Retire a book copy
exports.retireBook = async (req, res) => {
  try {
    const { id } = req.params;  // copy_id
    const { reason = 'DAMAGED', notes } = req.body;

    const allowedReasons = ['DAMAGED', 'LOST', 'DECOMMISSIONED'];
    if (!allowedReasons.includes(String(reason).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Reason must be DAMAGED, LOST, or DECOMMISSIONED' });
    }

    const [copyRows] = await pool.query('SELECT * FROM book_copies WHERE id = ?', [id]);
    if (copyRows.length === 0) return res.status(404).json({ success: false, message: 'Copy not found' });

    const copy = copyRows[0];
    if (copy.status === 'BORROWED') {
      return res.status(400).json({ success: false, message: 'Cannot retire a borrowed copy' });
    }
    if (copy.status === 'RETIRED') {
      return res.status(400).json({ success: false, message: 'Copy already retired' });
    }

    await pool.query(
      `UPDATE book_copies SET status = 'RETIRED', retired_reason = ? WHERE id = ?`,
      [String(reason).toUpperCase(), id]
    );

    // Insert into retired_books history
    await pool.query(
      `INSERT INTO retired_books (book_id, copy_id, reason, retired_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [copy.book_id, copy.id, String(reason).toUpperCase(), req.user.id, notes || null]
    );

    // Update book available counts
    await pool.query(
      `UPDATE books SET available_copies = available_copies - 1 WHERE id = ?`,
      [copy.book_id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_RETIRED', 'BOOK_COPY', ?, ?)`,
      [req.user.id, id, `${copy.copy_code} - ${reason}`]
    );

    res.json({ success: true, message: `Copy ${copy.copy_code} retired (${reason})` });
  } catch (err) {
    console.error('Retire book error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List retired books
exports.listRetired = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rb.*, bk.title, bc.copy_code, CONCAT(u.first_name, ' ', u.last_name) AS retired_by_name
       FROM retired_books rb
       JOIN books bk ON bk.id = rb.book_id
       JOIN book_copies bc ON bc.id = rb.copy_id
       LEFT JOIN users u ON u.id = rb.retired_by
       ORDER BY rb.retired_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List retired error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get book categories for filter
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND category != '' ORDER BY category`
    );
    res.json({ success: true, data: rows.map(r => r.category) });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
