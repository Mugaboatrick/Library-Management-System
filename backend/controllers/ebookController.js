const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Upload a new e-book (librarian) - accepts file + optional cover image
exports.uploadEbook = async (req, res) => {
  try {
    const file = req.files?.file?.[0] || req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Multer turns a repeated multipart field into an array. Take the first
    // value so a duplicated field can never shift the INSERT parameter list.
    const field = (name) => {
      const v = req.body[name];
      if (Array.isArray(v)) return v.length ? v[0] : undefined;
      return v;
    };

    const { title, author, subject, section, grade_level, isbn, qr_code } = {
      title: field('title'),
      author: field('author'),
      subject: field('subject'),
      section: field('section'),
      grade_level: field('grade_level'),
      isbn: field('isbn'),
      qr_code: field('qr_code')
    };
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const cover = req.files?.cover?.[0];
    const format = path.extname(file.originalname).toLowerCase().replace('.', '').toUpperCase();
    const coverPath = cover ? `/uploads/covers/${cover.filename}` : null;

    // Access mode decides what the user may do with the book:
    //  READ_ONLY   -> read online, borrow/download disabled
    //  READ_BORROW -> read online AND borrow (download to device once borrowed)
    //  BORROW_ONLY -> must borrow before reading online
    const accessMode = ['READ_ONLY', 'READ_BORROW', 'BORROW_ONLY'].includes(field('access_mode'))
      ? field('access_mode')
      : 'READ_ONLY';
    const isProtected = accessMode === 'READ_BORROW' ? 0 : 1;

    const [result] = await pool.query(
      `INSERT INTO ebooks (title, author, subject, section, grade_level, isbn, qr_code, file_path, file_size, format, is_protected, access_mode, cover_image, uploaded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [title, author || null, subject || null, section || null, grade_level || null, isbn || null, qr_code || null,
       file.filename, file.size, format, isProtected, accessMode, coverPath, req.user.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'EBOOK_UPLOADED', 'EBOOK', ?, ?)`,
      [req.user.id, result.insertId, title]
    );

    res.status(201).json({
      success: true,
      message: 'E-book uploaded successfully',
      ebook: { id: result.insertId, title, format }
    });
  } catch (err) {
    console.error('Upload ebook error:', err);
    try {
      require('fs').appendFileSync(
        path.join(__dirname, '..', 'error-diag.log'),
        `${new Date().toISOString()} [UPLOAD-ERR] ${err.message} | sql=${(err.sql || '').slice(0, 400)}\n`
      );
    } catch (e) {}
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// List e-books (protected - only metadata, not file path)
exports.listEbooks = async (req, res) => {
  try {
    const { search, subject, section, grade_level, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['status = ?'];
    let params = ['ACTIVE'];
    if (search) {
      where.push('(title LIKE ? OR author LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (subject) { where.push('subject = ?'); params.push(subject); }
    if (section) { where.push('section = ?'); params.push(section); }
    if (grade_level) { where.push('grade_level = ?'); params.push(grade_level); }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM ebooks ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT id, title, author, subject, section, grade_level, isbn, qr_code, file_size, format, is_protected, access_mode, cover_image, created_at
       FROM ebooks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: rows, pagination: { total: count?.total || 0 } });
  } catch (err) {
    console.error('List ebooks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Stream a protected e-book file (requires auth)
exports.readEbook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT * FROM ebooks WHERE id = ? AND status = 'ACTIVE'`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'E-book not found' });

    const ebook = rows[0];

    // Access-mode enforcement:
    //  READ_ONLY / READ_BORROW -> reading online is always allowed for logged-in users
    //  BORROW_ONLY             -> the user must have an active borrow before reading
    const virtualCode = `EBK${String(id).padStart(3, '0')}-D1`;
    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings b
       JOIN book_copies c ON c.id = b.copy_id
       WHERE c.copy_code = ? AND b.user_id = ? AND b.status IN ('BORROWED','OVERDUE')`,
      [virtualCode, userId]
    );
    if (ebook.access_mode === 'BORROW_ONLY' && !(borrowCount?.count > 0)) {
      return res.status(403).json({
        success: false,
        message: 'This digital book is borrow-only. Borrow it first to read online.'
      });
    }

    // Check access: librarian + all authenticated users (students/teachers/guests)
    // (Could restrict guests, but requirement says students & teachers read; we allow all authenticated)

    const filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(ebook.file_path));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'EBOOK_READ', 'EBOOK', ?, ?)`,
      [userId, id, ebook.title]
    );

    const contentType = ebook.format === 'PDF' ? 'application/pdf' : 'application/epub+zip';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${ebook.title}"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${ebook.title}"`,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error('Read ebook error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Download a copy of an e-book to the user's device.
// Access rules tied to access_mode:
//  READ_ONLY   -> copying/downloading is permanently disabled (read online only)
//  READ_BORROW -> a copy may be saved once the user has an active borrow
//  BORROW_ONLY -> a copy may be saved once the user has an active borrow (this is how they take the book)
exports.downloadEbook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT * FROM ebooks WHERE id = ? AND status = 'ACTIVE'`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'E-book not found' });
    const ebook = rows[0];

    if (ebook.access_mode === 'READ_ONLY') {
      return res.status(403).json({
        success: false,
        message: `"${ebook.title}" is protected (read-only) — you can read it online but copying and downloading are not allowed.`
      });
    }

    // Read-and-borrow / borrow-only books: downloading is the way to take a copy,
    // so an active borrow is required.
    const virtualCode = `EBK${String(id).padStart(3, '0')}-D1`;
    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings b
       JOIN book_copies c ON c.id = b.copy_id
       WHERE c.copy_code = ? AND b.user_id = ? AND b.status IN ('BORROWED','OVERDUE')`,
      [virtualCode, userId]
    );
    if (!(borrowCount?.count > 0)) {
      return res.status(403).json({
        success: false,
        message: `Borrow "${ebook.title}" first, then you can download your copy to this device.`
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(ebook.file_path));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'EBOOK_DOWNLOADED', 'EBOOK', ?, ?)`,
      [userId, id, ebook.title]
    );

    const contentType = ebook.format === 'PDF' ? 'application/pdf' : 'application/epub+zip';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${ebook.title}.${ebook.format.toLowerCase()}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('Download ebook error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update e-book metadata (librarian)
exports.updateEbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, subject, section, grade_level, isbn, qr_code } = req.body;

    const [exist] = await pool.query('SELECT id FROM ebooks WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'E-book not found' });

    await pool.query(
      `UPDATE ebooks SET title = COALESCE(?, title),
        author = COALESCE(?, author), subject = COALESCE(?, subject),
        section = COALESCE(?, section),
        grade_level = COALESCE(?, grade_level), isbn = COALESCE(?, isbn),
        qr_code = COALESCE(?, qr_code)
       WHERE id = ?`,
      [title, author, subject, section ?? null, grade_level, isbn, qr_code ?? null, id]
    );

    res.json({ success: true, message: 'E-book updated' });
  } catch (err) {
    console.error('Update ebook error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update an e-book's access mode (librarian)
exports.updateAccessMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { access_mode } = req.body;
    if (!['READ_ONLY', 'READ_BORROW', 'BORROW_ONLY'].includes(access_mode)) {
      return res.status(400).json({ success: false, message: 'access_mode must be READ_ONLY, READ_BORROW, or BORROW_ONLY' });
    }
    const isProtected = access_mode === 'READ_BORROW' ? 0 : 1;
    const [result] = await pool.query(
      'UPDATE ebooks SET access_mode = ?, is_protected = ? WHERE id = ?',
      [access_mode, isProtected, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'E-book not found' });
    }
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'EBOOK_ACCESS_MODE', 'EBOOK', ?, ?)`,
      [req.user.id, id, access_mode]
    );
    res.json({ success: true, message: `Access mode updated to ${access_mode}`, access_mode });
  } catch (err) {
    console.error('Update ebook access mode error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete e-book (librarian)
exports.deleteEbook = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM ebooks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'E-book not found' });

    const ebook = rows[0];
    const filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(ebook.file_path));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM ebooks WHERE id = ?', [id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'EBOOK_DELETED', 'EBOOK', ?, ?)`,
      [req.user.id, id, ebook.title]
    );

    res.json({ success: true, message: 'E-book deleted' });
  } catch (err) {
    console.error('Delete ebook error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bookmark management (e-reader)
exports.addBookmark = async (req, res) => {
  try {
    const { ebook_id, page_number, note } = req.body;
    const userId = req.user.id;

    if (!ebook_id || !page_number) {
      return res.status(400).json({ success: false, message: 'ebook_id and page_number required' });
    }

    const [result] = await pool.query(
      `INSERT INTO bookmarks (user_id, ebook_id, page_number, note) VALUES (?, ?, ?, ?)`,
      [userId, ebook_id, page_number, note || null]
    );

    res.status(201).json({ success: true, message: 'Bookmark added', bookmark: { id: result.insertId } });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.myBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT bm.*, eb.title FROM bookmarks bm JOIN ebooks eb ON eb.id = bm.ebook_id
       WHERE bm.user_id = ? ORDER BY bm.created_at DESC`, [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('My bookmarks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bookmarks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Bookmark deleted' });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
