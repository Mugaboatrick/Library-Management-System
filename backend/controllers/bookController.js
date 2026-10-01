const { pool } = require('../config/db');
const barcodePayload = require('../utils/barcodePayload');

// Add a new book with copies
exports.addBook = async (req, res) => {
  try {
    const {
      title, author, category = 'General', section = null, subject = null,
      grade_level = null, publisher, publish_year, shelf_location,
      copies = 1, description, first_copy_code, barcode_payload: incomingPayload
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Subject and Level are collected by the Add Hard Book form but had no
    // columns of their own, so Subject was landing in `section` and Level was
    // dropped. Both are now persisted explicitly; `section` stays the aisle
    // marker it was always meant to be.
    const [result] = await pool.query(
      `INSERT INTO books (title, author, category, subject, section, grade_level, publisher, publish_year, shelf_location, total_copies, available_copies, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, author || null, category,
        subject || null, section || null, grade_level || null,
        publisher || null, publish_year || null, shelf_location || null,
        parseInt(copies) || 1, parseInt(copies) || 1, description || null
      ]
    );

    const bookId = result.insertId;

    // Create copies
    const copyParams = [];
    const totalCopies = parseInt(copies) || 1;
    // The first copy carries the printed label, so it owns the barcode payload.
    // Every other copy of the same book shares the same metadata, so a scan of
    // any copy resolves to the same book.
    let firstPayload = null;
    for (let i = 0; i < totalCopies; i++) {
      let code = `BOOK${String(bookId).padStart(3, '0')}-C${i + 1}`;
      if (i === 0 && first_copy_code && String(first_copy_code).trim()) {
        code = String(first_copy_code).trim();
        // copy_code is VARCHAR(30) UNIQUE. When MySQL is not in strict mode an
        // over-long value is silently truncated on insert, so the copy actually
        // stored and the code reported back to the client would disagree — the
        // label would be printed from the long value and would then never
        // resolve on a scan. Clamp here so the reported code IS the stored code.
        if (code.length > 30) {
          code = code.slice(0, 30);
        }
        const [exists] = await pool.query('SELECT id FROM book_copies WHERE copy_code = ?', [code]);
        if (exists.length > 0) {
          code = `BOOK${String(bookId).padStart(3, '0')}-C${i + 1}`;
        }
      }
      if (i === 0) {
        // Rebuild the payload server-side from the values actually saved, so the
        // label can never disagree with the database. A client-supplied payload
        // is accepted only if it parses and its copy code matches.
        const { payload } = barcodePayload.encode({
          copy_code: code,
          title,
          author,
          category,
          subject,
          grade_level,
          shelf_location
        });
        firstPayload = payload;

        const parsedIncoming = incomingPayload ? barcodePayload.parse(incomingPayload) : null;
        if (
          parsedIncoming &&
          parsedIncoming.copy_code.toUpperCase() === code.toUpperCase()
        ) {
          firstPayload = String(incomingPayload).slice(0, barcodePayload.MAX_PAYLOAD);
        }
      } else {
        const { payload } = barcodePayload.encode({
          copy_code: code,
          title,
          author,
          category,
          subject,
          grade_level,
          shelf_location
        });
        copyParams.push([bookId, code, 'AVAILABLE', payload]);
        continue;
      }
      copyParams.push([bookId, code, 'AVAILABLE', firstPayload]);
    }
    let firstCopyId = null;
    if (copyParams.length) {
      const [insertRes] = await pool.query(
        'INSERT INTO book_copies (book_id, copy_code, status, barcode_payload) VALUES ?',
        [copyParams]
      );
      // The client re-labels the first copy after saving when the librarian
      // scans the publisher's own barcode, so it needs the row id to target
      // that update. InnoDB keeps INSERT ... VALUES ? ordered, so the first
      // generated id belongs to the first value in copyParams.
      firstCopyId = insertRes.insertId ?? null;
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_ADDED', 'BOOK', ?, ?)`,
      [req.user.id, bookId, `${title}, ${copies} copies`]
    );

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book_id: bookId,
      first_copy_code: copyParams.length ? copyParams[0][1] : null,
      first_copy_id: firstCopyId,
      barcode_payload: firstPayload
    });
  } catch (err) {
    console.error('Add book error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// List books with filters + search
exports.listBooks = async (req, res) => {
  try {
    const { search, category, section, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (search) {
      where.push('(b.title LIKE ? OR b.author LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }
    if (category) { where.push('b.category = ?'); params.push(category); }
    if (section) { where.push('b.section = ?'); params.push(section); }
    if (status) { where.push('b.status = ?'); params.push(String(status).toUpperCase()); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM books b ${whereClause}`, params);

    const [rows] = await pool.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id) AS total_copies,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'AVAILABLE') AS available,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'BORROWED') AS borrowed,
              (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'RETIRED') AS retired,
              -- A book that has never been borrowed can be deleted outright;
              -- one that has been borrowed is kept as the lending record.
              (CASE WHEN (
                  (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status IN ('BORROWED','RETIRED')) > 0
                  OR (SELECT COUNT(*) FROM borrowings bo JOIN book_copies bc ON bc.id = bo.copy_id WHERE bc.book_id = b.id) > 0
                  OR (SELECT COUNT(*) FROM returns r WHERE r.book_id = b.id) > 0
                ) THEN 1 ELSE 0 END) AS has_loan_history
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

// Resolve a scanned label to a concrete book copy or e-book.
//
// The client used to guess with regexes that only understood auto-generated
// copy codes (BOOK003-C2) and an `isbn` column the books table does not have,
// so real labels (custom copy codes, printed EAN/ISBN, e-book QR) never
// resolved. Resolution lives here so every label the system can print works.
exports.resolveScan = async (req, res) => {
  try {
    const raw = String(req.query.code || '').trim();
    if (!raw) {
      return res.status(400).json({ success: false, message: 'code is required' });
    }

    // 0. A generated book barcode: HH1|<copyCode>|<title>|<author>|...
    //    Parse it out of the scanned text and resolve the copy code it carries,
    //    so the label needs no server-side payload lookup to be useful.
    const parsed = barcodePayload.parse(raw);
    if (parsed) {
      const [p] = await pool.query(
        `SELECT bc.id, bc.book_id, bc.copy_code, bc.status, bc.barcode_payload, bk.title
         FROM book_copies bc JOIN books bk ON bk.id = bc.book_id
         WHERE UPPER(bc.copy_code) = ?`,
        [parsed.copy_code.toUpperCase()]
      );
      if (p.length > 0) {
        const c = p[0];
        return res.json({
          success: true,
          kind: 'copy',
          book_id: c.book_id,
          copy_code: c.copy_code,
          copy_status: c.status,
          title: c.title,
          // What the printed label said, so the operator can confirm the right
          // book was scanned before issuing it.
          label: {
            title: parsed.title,
            author: parsed.author,
            category: parsed.category,
            subject: parsed.subject,
            grade_level: parsed.grade_level,
            shelf_location: parsed.shelf_location
          },
          source: 'payload'
        });
      }
    }

    // 1. Exact copy code (covers BOOK003-C2 and custom codes like BK-BIOL-S1).
    //
    // This is the path the printed label actually takes, because the symbol
    // carries only the copy code. It must therefore return the complete book
    // record, read from `books` so the values are whole rather than the
    // character-capped snapshot held in barcode_payload.
    const [copies] = await pool.query(
      `SELECT bc.id, bc.book_id, bc.copy_code, bc.status, bk.title,
              bk.author, bk.category, bk.subject, bk.grade_level, bk.shelf_location
       FROM book_copies bc JOIN books bk ON bk.id = bc.book_id
       WHERE UPPER(bc.copy_code) = ?`,
      [raw.toUpperCase()]
    );
    if (copies.length > 0) {
      const c = copies[0];
      return res.json({
        success: true,
        kind: 'copy',
        book_id: c.book_id,
        copy_code: c.copy_code,
        copy_status: c.status,
        title: c.title,
        author: c.author,
        category: c.category,
        subject: c.subject,
        grade_level: c.grade_level,
        shelf_location: c.shelf_location
      });
    }

    // 2. Digit-only label (EAN-13 / UPC / ISBN printed on a book). Compare
    //    against copy codes too, since those are what carry the barcode today.
    const digits = raw.replace(/\D+/g, '');
    if (digits.length >= 8) {
      const stripped = digits.replace(/^97[89]/, '');
      const [byDigits] = await pool.query(
        `SELECT bc.id, bc.book_id, bc.copy_code, bc.status, bk.title,
                bk.author, bk.category, bk.subject, bk.grade_level, bk.shelf_location
         FROM book_copies bc JOIN books bk ON bk.id = bc.book_id
         WHERE REPLACE(REPLACE(UPPER(bc.copy_code), '-', ''), '_', '') = ?
            OR REPLACE(REPLACE(UPPER(bc.copy_code), '-', ''), '_', '') = ?`,
        [digits, stripped]
      );
      if (byDigits.length > 0) {
        const c = byDigits[0];
        return res.json({
          success: true,
          kind: 'copy',
          book_id: c.book_id,
          copy_code: c.copy_code,
          copy_status: c.status,
          title: c.title,
          author: c.author,
          category: c.category,
          subject: c.subject,
          grade_level: c.grade_level,
          shelf_location: c.shelf_location
        });
      }

      // 3. E-book by ISBN (only ebooks carry an isbn column).
      const [ebooks] = await pool.query(
        `SELECT id, title, qr_code, isbn FROM ebooks
         WHERE isbn IS NOT NULL AND isbn <> ''
           AND (REPLACE(REPLACE(UPPER(isbn), '-', ''), ' ', '') = ?
             OR REPLACE(REPLACE(UPPER(isbn), '-', ''), ' ', '') = ?
             OR REPLACE(REPLACE(UPPER(isbn), '-', ''), ' ', '') = ?)`,
        [digits, stripped, `978${stripped}`]
      );
      if (ebooks.length > 0) {
        const e = ebooks[0];
        return res.json({
          success: true,
          kind: 'ebook',
          id: e.id,
          title: e.title,
          code: e.qr_code || e.isbn,
          ebook: { id: e.id, title: e.title, qr_code: e.qr_code, isbn: e.isbn }
        });
      }
    }

    // 4. E-book by stored QR value, tolerant of JSON wrappers and prefix noise.
    const flat = raw.replace(/\s+/g, ' ').trim();
    const [qrRows] = await pool.query(
      `SELECT id, title, qr_code, isbn FROM ebooks
       WHERE qr_code IS NOT NULL AND qr_code <> ''
         AND (UPPER(REPLACE(REPLACE(qr_code, ' ', ''), '\\n', '')) = ?
              OR UPPER(qr_code) = ?
              OR UPPER(REPLACE(qr_code, 'BOOK-ISBN-', '')) = ?)`,
      [flat.replace(/\s+/g, '').toUpperCase(), flat.toUpperCase(), flat.toUpperCase()]
    );
    if (qrRows.length > 0) {
      const e = qrRows[0];
      return res.json({
        success: true,
        kind: 'ebook',
        id: e.id,
        title: e.title,
        code: e.qr_code,
        ebook: { id: e.id, title: e.title, qr_code: e.qr_code, isbn: e.isbn }
      });
    }

    return res.status(404).json({ success: false, message: 'No book, copy or e-book matches that code' });
  } catch (err) {
    console.error('Resolve scan error:', err);
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
    const { title, author, category, section, publisher, publish_year, shelf_location, description } = req.body;

    const [exist] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });

    await pool.query(
      `UPDATE books SET title = COALESCE(?, title),
        author = COALESCE(?, author), category = COALESCE(?, category),
        section = COALESCE(?, section),
        publisher = COALESCE(?, publisher), publish_year = COALESCE(?, publish_year),
        shelf_location = COALESCE(?, shelf_location), description = COALESCE(?, description)
       WHERE id = ?`,
      [title, author, category, section ?? null, publisher, publish_year, shelf_location, description, id]
    );

    res.json({ success: true, message: 'Book updated' });
  } catch (err) {
    console.error('Update book error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Replace a copy's barcode with one read off the book itself.
//
// The librarian adds a book that already carries the publisher's own barcode,
// so instead of issuing a generated BOOK###-C# label they can scan what is
// printed on the spine. The stored barcode_payload is rebuilt from the values
// actually in the database, so the re-issued label can never disagree with the
// record, and a legacy label printed with the OLD code still resolves because
// resolveScan matches on copy_code.
exports.setCopyCode = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const copyId = parseInt(req.params.copyId, 10);
    if (!Number.isInteger(copyId) || copyId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid copy id' });
    }

    const requested = String(req.body?.copy_code || '').trim();
    if (!requested) {
      return res.status(400).json({ success: false, message: 'copy_code is required' });
    }
    // copy_code is VARCHAR(30); a longer value would be silently truncated on
    // some MySQL configurations, leaving the printed label unable to resolve.
    if (requested.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Barcode must be 30 characters or fewer'
      });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT bc.id, bc.copy_code, bc.status, bc.book_id,
              bk.title, bk.author, bk.category, bk.section, bk.shelf_location
       FROM book_copies bc JOIN books bk ON bk.id = bc.book_id
       WHERE bc.id = ? FOR UPDATE`,
      [copyId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Copy not found' });
    }

    const copy = rows[0];

    // A returned scan looks the copy up by copy_code, so relabelling a copy
    // that is out on loan would leave the librarian unable to check it back in.
    if (copy.status === 'BORROWED' || copy.status === 'OVERDUE') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This copy is currently borrowed. Return it before changing its barcode.'
      });
    }
    if (copy.status === 'RETIRED') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This copy is retired and can no longer be relabelled.'
      });
    }

    if (copy.copy_code.toUpperCase() === requested.toUpperCase()) {
      await conn.rollback();
      return res.status(200).json({
        success: true,
        unchanged: true,
        copy_id: copy.id,
        copy_code: copy.copy_code,
        message: 'Barcode unchanged'
      });
    }

    const [clash] = await conn.query(
      'SELECT id FROM book_copies WHERE UPPER(copy_code) = ? AND id <> ?',
      [requested.toUpperCase(), copyId]
    );
    if (clash.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Barcode "${requested}" is already used by another copy`
      });
    }

    // Rebuild the payload from the saved book row so the printed label always
    // matches the record.
    const { payload } = barcodePayload.encode({
      copy_code: requested,
      title: copy.title,
      author: copy.author,
      category: copy.category,
      subject: null,
      grade_level: copy.section,
      shelf_location: copy.shelf_location
    });

    await conn.query(
      'UPDATE book_copies SET copy_code = ?, barcode_payload = ? WHERE id = ?',
      [requested, payload, copyId]
    );

    await conn.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_COPY_RELABELLED', 'BOOK_COPY', ?, ?)`,
      [req.user.id, copyId, `${copy.copy_code} -> ${requested}`]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Barcode updated',
      copy_id: copy.id,
      book_id: copy.book_id,
      copy_code: requested,
      previous_copy_code: copy.copy_code,
      barcode_payload: payload
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('Set copy code error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    conn.release();
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
// Retire every copy of a book in one call.
//
// Once a book has been borrowed its loan/return rows are the audit trail, so it
// can no longer be deleted. Retiring all of its copies is the supported way to
// take it out of circulation while keeping that history.
exports.retireAllCopies = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { reason = 'DECOMMISSIONED', notes } = req.body;

    const allowedReasons = ['DAMAGED', 'LOST', 'DECOMMISSIONED'];
    if (!allowedReasons.includes(String(reason).toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Reason must be DAMAGED, LOST, or DECOMMISSIONED' });
    }

    conn = await pool.getConnection();
    const [books] = await conn.query('SELECT id, title FROM books WHERE id = ?', [id]);
    if (books.length === 0) return res.status(404).json({ success: false, message: 'Book not found' });
    const book = books[0];

    const [copies] = await conn.query(
      "SELECT id, copy_code, status FROM book_copies WHERE book_id = ? AND status <> 'RETIRED'",
      [id]
    );
    const borrowed = copies.filter((c) => c.status === 'BORROWED');
    if (borrowed.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot retire "${book.title}" yet - ${borrowed.length} cop${borrowed.length === 1 ? 'y is' : 'ies are'} still on loan. Wait for the return first.`
      });
    }
    if (copies.length === 0) {
      return res.status(400).json({ success: false, message: `All copies of "${book.title}" are already retired` });
    }

    await conn.beginTransaction();
    const copyIds = copies.map((c) => c.id);
    await conn.query(
      `UPDATE book_copies SET status = 'RETIRED', retired_reason = ? WHERE id IN (?)`,
      [String(reason).toUpperCase(), copyIds]
    );
    const history = copyIds.map((cid) => [book.id, cid, String(reason).toUpperCase(), req.user.id, notes || null]);
    await conn.query(
      'INSERT INTO retired_books (book_id, copy_id, reason, retired_by, notes) VALUES ?',
      [history]
    );
    await conn.query('UPDATE books SET available_copies = 0 WHERE id = ?', [id]);
    await conn.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_RETIRED', 'BOOK', ?, ?)`,
      [req.user.id, id, `${book.title} - all ${copyIds.length} copies retired (${reason})`]
    );
    await conn.commit();

    res.json({
      success: true,
      message: `"${book.title}" retired - all ${copyIds.length} cop${copyIds.length === 1 ? 'y' : 'ies'} taken out of circulation. Lending history kept.`
    });
  } catch (err) {
    try { if (conn) await conn.rollback(); } catch { /* connection already gone */ }
    console.error('Retire all copies error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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

// Delete a book and all of its copies.
// Guarded: a book cannot be removed while a copy is on loan, or once it has
// return history, because the DB cascades copies -> borrowings and would
// silently destroy the loan record. retired_books keeps book_id via SET NULL.
exports.deleteBook = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const [bookRows] = await conn.query('SELECT * FROM books WHERE id = ?', [id]);
    if (bookRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const book = bookRows[0];

    // A hard book that has never been borrowed is a plain catalogue mistake
    // and must be removable. Once it has ever been borrowed, its loan and
    // return rows are the audit trail that proves what was lent to whom, so
    // the record is kept and the copies are retired instead.
    const [borrowedEver] = await conn.query(
      `SELECT
         (SELECT COUNT(*) FROM book_copies WHERE book_id = ? AND status IN ('BORROWED','RETIRED')) AS copies_unavailable,
         (SELECT COUNT(*) FROM borrowings bo
            JOIN book_copies bc ON bc.id = bo.copy_id
            WHERE bc.book_id = ?) AS borrowing_records,
         (SELECT COUNT(*) FROM returns WHERE book_id = ?) AS return_records`,
      [id, id, id]
    );
    const { copies_unavailable: unavailable, borrowing_records: loans, return_records: returns } = borrowedEver[0];

    if (unavailable > 0 || loans > 0 || returns > 0) {
      const because = [];
      if (unavailable > 0) because.push(`${unavailable} cop${unavailable === 1 ? 'y is' : 'ies are'} on loan or retired`);
      if (loans > 0) because.push(`${loans} borrowing record${loans === 1 ? '' : 's'}`);
      if (returns > 0) because.push(`${returns} return record${returns === 1 ? '' : 's'}`);
      return res.status(409).json({
        success: false,
        has_history: true,
        message: `Cannot delete "${book.title}" - it has been borrowed (${because.join(', ')}). `
          + 'Retire the copies instead so the lending history is kept.'
      });
    }

    await conn.beginTransaction();
    const [copies] = await conn.query('SELECT id FROM book_copies WHERE book_id = ?', [id]);
    const copyIds = copies.map((c) => c.id);
    if (copyIds.length) {
      await conn.query('DELETE FROM retired_books WHERE copy_id IN (?)', [copyIds]);
    }
    await conn.query('DELETE FROM book_copies WHERE book_id = ?', [id]);
    await conn.query('DELETE FROM books WHERE id = ?', [id]);
    await conn.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_DELETED', 'BOOK', ?, ?)`,
      [req.user.id, id, `${book.title} - ${copies.length} cop${copies.length === 1 ? 'y' : 'ies'} deleted`]
    );
    await conn.commit();

    res.json({
      success: true,
      message: `"${book.title}" deleted (${copies.length} cop${copies.length === 1 ? 'y' : 'ies'})`
    });
  } catch (err) {
    try { if (conn) await conn.rollback(); } catch { /* connection already gone */ }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this book - it is referenced by other records.'
      });
    }
    console.error('Delete book error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    if (conn) conn.release();
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

// Get book sections for filter
exports.getSections = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT section FROM books WHERE section IS NOT NULL AND section != '' ORDER BY section`
    );
    res.json({ success: true, data: rows.map(r => r.section) });
  } catch (err) {
    console.error('Get sections error:', err);
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
