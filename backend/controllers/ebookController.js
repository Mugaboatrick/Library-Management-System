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

    const { title, author, subject, grade_level } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const cover = req.files?.cover?.[0];
    const format = path.extname(file.originalname).toLowerCase().replace('.', '').toUpperCase();
    const coverPath = cover ? `/uploads/covers/${cover.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO ebooks (title, author, subject, grade_level, file_path, file_size, format, cover_image, uploaded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [title, author || null, subject || null, grade_level || null,
       file.filename, file.size, format, coverPath, req.user.id]
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List e-books (protected - only metadata, not file path)
exports.listEbooks = async (req, res) => {
  try {
    const { search, subject, grade_level, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['status = ?'];
    let params = ['ACTIVE'];
    if (search) {
      where.push('(title LIKE ? OR author LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (subject) { where.push('subject = ?'); params.push(subject); }
    if (grade_level) { where.push('grade_level = ?'); params.push(grade_level); }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM ebooks ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT id, title, author, subject, grade_level, file_size, format, cover_image, created_at
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

    // A user who has borrowed this digital book cannot read it online until returned
    const virtualCode = `EBK${String(id).padStart(3, '0')}-D1`;
    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings b
       JOIN book_copies c ON c.id = b.copy_id
       WHERE c.copy_code = ? AND b.user_id = ? AND b.status IN ('BORROWED','OVERDUE')`,
      [virtualCode, userId]
    );
    if (borrowCount?.count > 0) {
      return res.status(403).json({
        success: false,
        message: 'This digital book is currently borrowed on your account. Return it before reading online.'
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

// Download e-book (auth-only) — works even for borrowed books so the device gets a local copy
exports.downloadEbook = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM ebooks WHERE id = ? AND status = 'ACTIVE'`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'E-book not found' });
    const ebook = rows[0];

    const filePath = path.join(__dirname, '..', 'uploads', 'ebooks', path.basename(ebook.file_path));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const safeTitle = (ebook.title || 'ebook').replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_');
    const ext = path.extname(ebook.file_path) || '.pdf';
    const filename = `${safeTitle}${ext}`;
    const contentType = ebook.format === 'PDF' ? 'application/pdf' : 'application/epub+zip';
    const stat = fs.statSync(filePath);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'EBOOK_DOWNLOAD', 'EBOOK', ?, ?)`,
      [req.user.id, id, JSON.stringify({ title: ebook.title, format: ebook.format })]
    );

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('Download ebook error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error' });
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
