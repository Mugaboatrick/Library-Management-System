const { pool } = require('../config/db');
const { getBorrowLimit, calculateFine, calculateConditionFine, updateUserBlockStatus, getOverdueDays, DAILY_RATE } = require('../utils/fineUtils');
const { emitToLibrarians } = require('../utils/socket');
const { createNotification } = require('./notificationController');

const LOAN_DAYS = 14; // default loan duration

// Borrow a book:
// 1. Verify customer (by customer_id or user_id from QR scan)
// 2. Check user exists & active
// 3. Check fine status
// 4. Select available copy (by copy_code or book id)
// 5. Create loan with due date
// NOTE: Students/teachers/guests (non-librarians) create a REQUEST first.
//       The librarian must approve it (approveBorrow) before the copy is issued.
exports.borrowBook = async (req, res) => {
  try {
    let { customer_code, user_id, book_reference, copy_code, due_days, ebook_id } = req.body;

    const isLibrarian = req.user.role === 'LIBRARIAN';
    const isEbook = !!ebook_id;

    // Self-service: non-librarians can only borrow for their own account
    if (!isLibrarian) {
      customer_code = null;
      user_id = req.user.id;
    }

    // Resolve user
    let userId = user_id;
    if (customer_code) {
      const [u] = await pool.query('SELECT id, status FROM users WHERE customer_id = ?', [customer_code]);
      if (u.length === 0) return res.status(404).json({ success: false, message: 'Customer card not found' });
      userId = u[0].id;
      if (u[0].status !== 'ACTIVE') return res.status(400).json({ success: false, message: `User account is ${u[0].status}` });
    } else if (user_id) {
      const [u] = await pool.query('SELECT id, status, role FROM users WHERE id = ?', [user_id]);
      if (u.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      if (u[0].status !== 'ACTIVE') return res.status(400).json({ success: false, message: `User account is ${u[0].status}` });
    } else {
      return res.status(400).json({ success: false, message: 'Customer identification required (customer_code or user_id)' });
    }

    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    // System administrators / librarians manage the library but are not members:
    // they can read books but must never be the borrower of a loan.
    if (user.role === 'LIBRARIAN') {
      return res.status(403).json({
        success: false,
        message: 'System administrators manage the library and cannot borrow books. Borrowing is for members only.'
      });
    }

    // Check fine status - block if blocked
    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: `Account blocked: ${user.blocked_reason || 'outstanding fines'}` });
    }

    // Check active borrow count vs limit (pending requests also occupy a slot)
    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings WHERE user_id = ? AND status IN ('BORROWED','OVERDUE','REQUESTED')`,
      [userId]
    );
    const limit = getBorrowLimit(user.role);
    if ((borrowCount?.count || 0) >= limit) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit reached (${limit}). You cannot borrow more books.`
      });
    }

    // Unpaid fines must be cleared before borrowing
    const [[unpaid]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fines WHERE user_id = ? AND status='UNPAID'`,
      [userId]
    );
    const unpaidTotal = parseFloat(unpaid?.total || 0);
    if (unpaidTotal > 0) {
      return res.status(400).json({
        success: false,
        message: `Pay your outstanding fines (${unpaidTotal} RWF) before borrowing a book.`
      });
    }

    // Resolve book copy
    let copyId = null;
    if (copy_code) {
      const [c] = await pool.query(
        `SELECT bc.*, bk.id AS book_id, bk.title FROM book_copies bc
         JOIN books bk ON bk.id = bc.book_id
         WHERE bc.copy_code = ?`, [copy_code]
      );
      if (c.length === 0) return res.status(404).json({ success: false, message: 'Copy code not found' });
      if (c[0].status !== 'AVAILABLE') return res.status(400).json({ success: false, message: `Copy is ${c[0].status}` });
      copyId = c[0].id;
    } else if (ebook_id) {
      // Digital e-book lending: one borrowable copy per e-book (compiled when first borrowed)
      const numericId = parseInt(ebook_id);
      const virtualCode = `EBK${String(numericId).padStart(3, '0')}-D1`;
      const [ebMode] = await pool.query(
        `SELECT access_mode FROM ebooks WHERE id = ? AND status = 'ACTIVE'`, [numericId]
      );
      if (ebMode.length === 0) return res.status(404).json({ success: false, message: 'Digital book not found' });
      // READ_ONLY books are read online only — borrowing is not available for them
      if (ebMode[0].access_mode === 'READ_ONLY') {
        return res.status(400).json({
          success: false,
          message: 'This digital book is read-only — you can read it online but it cannot be borrowed.'
        });
      }
      const [ex] = await pool.query('SELECT id, status FROM book_copies WHERE copy_code = ?', [virtualCode]);
      if (ex.length) {
        if (ex[0].status !== 'AVAILABLE') {
          return res.status(400).json({ success: false, message: 'This digital book is currently borrowed. Try again later.' });
        }
        copyId = ex[0].id;
      } else {
        const [eb] = await pool.query('SELECT title, author FROM ebooks WHERE id = ?', [numericId]);
        if (eb.length === 0) return res.status(404).json({ success: false, message: 'Digital book not found' });
        const [ins] = await pool.query(
          `INSERT INTO books (title, author, category, publisher, publish_year, shelf_location, available_copies, total_copies, description)
           VALUES (?, ?, 'Digital', 'Hope Haven Library', NULL, 'DIGITAL', 1, 1, ?)`,
          [eb[0].title, eb[0].author || null, `Digital copy of ${eb[0].title}`]
        );
        const [ci] = await pool.query(
          `INSERT INTO book_copies (book_id, copy_code, status) VALUES (?, ?, 'AVAILABLE')`,
          [ins.insertId, virtualCode]
        );
        copyId = ci.insertId;
      }
    } else if (book_reference) {
      // Find an available copy by book id
      const [b] = await pool.query(
        `SELECT bc.id FROM book_copies bc JOIN books bk ON bk.id = bc.book_id
         WHERE bk.id = ? AND bc.status = 'AVAILABLE' LIMIT 1`,
        [isNaN(book_reference) ? -1 : book_reference]
      );
      if (b.length === 0) return res.status(404).json({ success: false, message: 'No available copy of this book' });
      copyId = b[0].id;
    } else {
      return res.status(400).json({ success: false, message: 'Book reference (copy_code or book_reference) required' });
    }

    // Create borrow
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(due_days) || LOAN_DAYS));

    // Non-librarians requesting a PHYSICAL book create a REQUEST — the librarian approves before the copy is issued.
    // Digital e-books are read online, so they are issued instantly to the user.
    // The copy stays AVAILABLE during a REQUEST so other people can still see the book.
    const isRequestFlow = !isLibrarian && !ebook_id;
    const status = isRequestFlow ? 'REQUESTED' : 'BORROWED';

    const [result] = await pool.query(
      `INSERT INTO borrowings (user_id, copy_id, borrow_date, due_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, copyId, borrowDate, dueDate, status]
    );

    const [bookInfo] = await pool.query(
      `SELECT bk.title, bc.copy_code FROM book_copies bc JOIN books bk ON bk.id = bc.book_id WHERE bc.id = ?`,
      [copyId]
    );

    if (isRequestFlow) {
      // Pending request — copy stays AVAILABLE, audit + notify librarians
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES (?, 'BOOK_REQUESTED', 'BORROWING', ?, ?)`,
        [req.user.id, result.insertId, JSON.stringify({ user: user.customer_id, copy: bookInfo[0]?.copy_code, pending: true }) ]
      );

      emitToLibrarians('book_requested', {
        customer: user.customer_id,
        copy: bookInfo[0]?.copy_code,
        title: bookInfo[0]?.title,
        user_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.customer_id,
        request_id: result.insertId
      });

      // The socket event above only reaches librarians whose browser is open
      // and connected right now. Persist a notification for every librarian so
      // a request made while the desk is unattended (or while a tab is
      // backgrounded and misses the event) still shows up in the bell.
      const [librarians] = await pool.query(
        `SELECT id FROM users WHERE role = 'LIBRARIAN' AND status = 'ACTIVE'`
      );
      const requesterName = user.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user.customer_id;
      for (const lib of librarians) {
        if (lib.id === req.user.id) continue;
        await createNotification({
          userId: lib.id,
          type: 'BORROW_REQUEST',
          title: 'New borrow request',
          message: `${requesterName} (${user.customer_id}) requested "${bookInfo[0]?.title}" (${bookInfo[0]?.copy_code}).`,
          data: {
            request_id: result.insertId,
            customer_id: user.customer_id,
            copy_code: bookInfo[0]?.copy_code,
            title: bookInfo[0]?.title
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Borrow request sent. The librarian will confirm it, then you can pick up the book from the library.',
        request: { id: result.insertId },
        book: bookInfo[0],
        pending_count: (borrowCount?.count || 0) + 1,
        unpaid_fine: parseFloat(unpaid?.total || 0)
      });
      return;
    }

    // Instant issue: librarian-scan flow OR digital e-book read-online flow
    await pool.query(`UPDATE book_copies SET status = 'BORROWED' WHERE id = ?`, [copyId]);

    await pool.query(
      `UPDATE books SET available_copies = available_copies - 1
       WHERE id = (SELECT book_id FROM book_copies WHERE id = ?)`, [copyId]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_BORROWED', 'BORROWING', ?, ?)`,
      [req.user.id, result.insertId, JSON.stringify({ user: user.customer_id, copy: bookInfo[0]?.copy_code }) ]
    );

    emitToLibrarians('book_borrowed', {
      customer: user.customer_id,
      copy: bookInfo[0]?.copy_code,
      due_date: dueDate
    });

    // Notify the member that the librarian issued the book to them
    await createNotification({
      userId,
      type: 'BORROW_CONFIRMED',
      title: isEbook ? 'E-book available to read' : 'Book issued by librarian',
      message: isEbook
        ? `"${bookInfo[0]?.title}" (${bookInfo[0]?.copy_code}) has been issued to you. You can read it online in My E-Books now.`
        : `"${bookInfo[0]?.title}" (${bookInfo[0]?.copy_code}) has been issued to you by the librarian. Please pick it up and return it by ${dueDate.toLocaleDateString()}.`,
      data: { borrowing_id: result.insertId, title: bookInfo[0]?.title, copy_code: bookInfo[0]?.copy_code, due_date: dueDate, digital: isEbook },
      emitEvent: 'borrow_confirmed',
      payload: { title: bookInfo[0]?.title, copy_code: bookInfo[0]?.copy_code, due_date: dueDate, digital: isEbook }
    });

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      loan: { id: result.insertId, due_date: dueDate },
      book: bookInfo[0],
      borrow_count: (borrowCount?.count || 0) + 1,
      borrow_limit: limit,
      unpaid_fine: parseFloat(unpaid?.total || 0)
    });
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Approve a pending borrow request (issued by a librarian)
// 1. Verify request exists and is still REQUESTED
// 2. Re-verify the user (active, limit, unpaid fines)
// 3. Issue the copy (mark BORROWED) and set due date
exports.approveBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT b.*, u.id AS uid, u.status AS user_status, u.blocked_reason, u.role AS user_role,
              u.customer_id, bk.title, bc.copy_code, bc.status AS copy_status
       FROM borrowings b
       JOIN users u ON u.id = b.user_id
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       WHERE b.id = ? AND b.status = 'REQUESTED'`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }
    const reqRecord = rows[0];

    // Re-check user state at approval time
    if (reqRecord.user_status !== 'ACTIVE') {
      await pool.query(`UPDATE borrowings SET status = 'REJECTED' WHERE id = ?`, [id]);
      return res.status(400).json({ success: false, message: `User account is ${reqRecord.user_status}. Request rejected.` });
    }
    if (reqRecord.copy_status !== 'AVAILABLE') {
      await pool.query(`UPDATE borrowings SET status = 'REJECTED' WHERE id = ?`, [id]);
      return res.status(400).json({ success: false, message: 'This copy is no longer available. Request rejected.' });
    }

    const [[borrowCount]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings WHERE user_id = ? AND status IN ('BORROWED','OVERDUE')`,
      [reqRecord.uid]
    );
    const limit = getBorrowLimit(reqRecord.user_role);
    if ((borrowCount?.count || 0) >= limit) {
      await pool.query(`UPDATE borrowings SET status = 'REJECTED' WHERE id = ?`, [id]);
      return res.status(400).json({ success: false, message: `Borrow limit reached (${limit}). Request rejected.` });
    }

    const [[unpaid]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM fines WHERE user_id = ? AND status='UNPAID'`,
      [reqRecord.uid]
    );
    if (parseFloat(unpaid?.total || 0) > 0) {
      await pool.query(`UPDATE borrowings SET status = 'REJECTED' WHERE id = ?`, [id]);
      return res.status(400).json({ success: false, message: 'User has unpaid fines. Request rejected.' });
    }

    const dueDate = new Date(reqRecord.due_date);

    await pool.query(
      `UPDATE borrowings SET status = 'BORROWED' WHERE id = ?`,
      [id]
    );
    await pool.query(`UPDATE book_copies SET status = 'BORROWED' WHERE id = ?`, [reqRecord.copy_id]);
    await pool.query(
      `UPDATE books SET available_copies = available_copies - 1 WHERE id = (SELECT book_id FROM book_copies WHERE id = ?)`,
      [reqRecord.copy_id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BORROW_APPROVED', 'BORROWING', ?, ?)`,
      [req.user.id, id, JSON.stringify({ user: reqRecord.customer_id, copy: reqRecord.copy_code }) ]
    );

    emitToLibrarians('borrow_approved', {
      customer: reqRecord.customer_id,
      copy: reqRecord.copy_code,
      due_date: dueDate
    });
    await createNotification({
      userId: reqRecord.uid,
      type: 'BORROW_APPROVED',
      title: 'Borrow request approved',
      message: `Your request for "${reqRecord.title}" was approved. Copy ${reqRecord.copy_code} is ready to pick up at the library. Please return it by ${new Date(dueDate).toLocaleDateString()}.`,
      data: { borrowing_id: id, book_title: reqRecord.title, copy_code: reqRecord.copy_code, due_date: dueDate },
      emitEvent: 'borrow_approved',
      payload: { title: reqRecord.title, copy: reqRecord.copy_code, due_date: dueDate }
    });

    res.json({
      success: true,
      message: `Borrow request approved. Copy ${reqRecord.copy_code} issued.`,
      book: { title: reqRecord.title, copy_code: reqRecord.copy_code },
      due_date: dueDate
    });
  } catch (err) {
    console.error('Approve borrow error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Reject a pending borrow request
exports.rejectBorrow = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT b.*, u.customer_id, bk.title, bc.copy_code
       FROM borrowings b
       JOIN users u ON u.id = b.user_id
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       WHERE b.id = ? AND b.status = 'REQUESTED'`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pending request not found' });
    }
    const reqRecord = rows[0];

    await pool.query(`UPDATE borrowings SET status = 'REJECTED' WHERE id = ?`, [id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BORROW_REJECTED', 'BORROWING', ?, ?)`,
      [req.user.id, id, JSON.stringify({ user: reqRecord.customer_id, copy: reqRecord.copy_code }) ]
    );

    emitToLibrarians('borrow_rejected', {
      customer: reqRecord.customer_id,
      copy: reqRecord.copy_code
    });
    await createNotification({
      userId: reqRecord.user_id,
      type: 'BORROW_REJECTED',
      title: 'Borrow request declined',
      message: `Your borrow request for "${reqRecord.title}" (${reqRecord.copy_code}) was declined by the librarian.`,
      data: { borrowing_id: id, book_title: reqRecord.title, copy_code: reqRecord.copy_code },
      emitEvent: 'borrow_rejected',
      payload: { title: reqRecord.title, copy: reqRecord.copy_code }
    });

    res.json({ success: true, message: `Borrow request rejected. Copy ${reqRecord.copy_code} was not issued.` });
  } catch (err) {
    console.error('Reject borrow error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Return a book:
// 1. Locate loan by copy_code
// 2. Compare due date -> calculate fine
// 3. Assess condition -> damage/loss flat fine
// 4. Return book & update status
exports.returnBook = async (req, res) => {
  try {
    const { copy_code, copy_id, condition_note, condition } = req.body;

    // Locate the active loan for this copy
    let copyId = copy_id;
    if (copy_code) {
      const [c] = await pool.query('SELECT id FROM book_copies WHERE copy_code = ?', [copy_code]);
      if (c.length === 0) return res.status(404).json({ success: false, message: 'Copy not found' });
      copyId = c[0].id;
    }
    if (!copyId) return res.status(400).json({ success: false, message: 'copy_code or copy_id required' });

    const [loans] = await pool.query(
      `SELECT b.*, bc.book_id, bc.copy_code, bk.title, u.customer_id, u.id AS uid
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       JOIN users u ON u.id = b.user_id
       WHERE b.copy_id = ? AND b.status IN ('BORROWED','OVERDUE')
       ORDER BY b.borrow_date DESC LIMIT 1`,
      [copyId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'No active loan found for this book copy' });
    }

    const loan = loans[0];
    const returnDate = new Date();

    // Calculate overdue fine (days * daily rate)
    const { amount, daysOverdue } = calculateFine(loan.borrow_date, loan.due_date, returnDate);

    // Calculate condition-based fine (damage/loss flat rate) if condition provided
    const conditionType = condition ? String(condition).toUpperCase() : null;
    const conditionFine = conditionType ? calculateConditionFine(conditionType) : 0;
    const totalFine = amount + conditionFine;

    // Insert return record
    const [retResult] = await pool.query(
      `INSERT INTO returns (borrowing_id, user_id, book_id, copy_id, return_date, days_overdue, fine_amount, condition_note, handled_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [loan.id, loan.uid, loan.book_id, copyId, returnDate, daysOverdue, totalFine, condition_note || null, req.user.id]
    );

    // Update borrowing
    await pool.query(
      `UPDATE borrowings SET returned_date = ?, status = 'RETURNED' WHERE id = ?`,
      [returnDate, loan.id]
    );

    // If book is lost, retire the copy; if damaged, keep it (could be retired later by librarian)
    if (conditionType === 'LOST') {
      await pool.query(
        `UPDATE book_copies SET status = 'RETIRED', retired_reason = 'LOST' WHERE id = ?`,
        [copyId]
      );
      await pool.query(
        `INSERT INTO retired_books (book_id, copy_id, reason, retired_by, notes)
         VALUES (?, ?, 'LOST', ?, ?)`,
        [loan.book_id, copyId, req.user.id, 'Lost during circulation']
      );
    } else {
      // Update copy status
      await pool.query(`UPDATE book_copies SET status = 'AVAILABLE' WHERE id = ?`, [copyId]);
    }

    // Update book available copies only if not lost (lost copy stays out of circulation)
    if (conditionType !== 'LOST') {
      await pool.query(
        `UPDATE books SET available_copies = available_copies + 1 WHERE id = ?`, [loan.book_id]
      );
    } else {
      await pool.query(
        `UPDATE books SET available_copies = available_copies - 1 WHERE id = ?`, [loan.book_id]
      );
    }

    // Fines are recorded separately per reason so the Fines page can show exactly
    // what the member is paying for. A member is NEVER charged for simply
    // borrowing: only a late return (OVERDUE) or a book returned damaged/lost
    // (DAMAGE / LOSS) creates a fine.
    let fineId = null;
    const fineIds = [];
    if (amount > 0) {
      const [r] = await pool.query(
        `INSERT INTO fines (user_id, borrowing_id, amount, fine_type, days_overdue, status)
         VALUES (?, ?, ?, 'OVERDUE', ?, 'UNPAID')`,
        [loan.uid, loan.id, amount, daysOverdue]
      );
      fineIds.push(r.insertId);
    }
    if (conditionFine > 0) {
      const [r] = await pool.query(
        `INSERT INTO fines (user_id, borrowing_id, amount, fine_type, days_overdue, status)
         VALUES (?, ?, ?, ?, ?, 'UNPAID')`,
        [loan.uid, loan.id, conditionFine, conditionType === 'LOST' ? 'LOSS' : 'DAMAGE', daysOverdue]
      );
      fineIds.push(r.insertId);
    }
    fineId = fineIds[0] || null;

    if (fineIds.length > 0) {
      // Check if user should be blocked
      await updateUserBlockStatus(loan.uid);
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_RETURNED', 'RETURN', ?, ?)`,
      [req.user.id, retResult.insertId, JSON.stringify({ copy: loan.copy_code, fine: totalFine, condition: conditionType }) ]
    );

    // Real-time notification
    emitToLibrarians('book_returned', {
      copy: loan.copy_code,
      fine: totalFine,
      condition: conditionType || 'GOOD'
    });

    await createNotification({
      userId: loan.uid,
      type: 'BOOK_RETURNED',
      title: totalFine > 0 ? 'Book returned — fine applied' : 'Book returned',
      message: totalFine > 0
        ? `"${loan.title}" (${loan.copy_code}) was returned. A fine of ${totalFine} RWF has been applied${daysOverdue > 0 ? ` (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)` : ''}.`
        : `"${loan.title}" (${loan.copy_code}) was returned to the library successfully.`,
      data: { borrowing_id: loan.id, book_title: loan.title, copy_code: loan.copy_code, fine: totalFine },
      emitEvent: 'book_returned',
      payload: { title: loan.title, copy_code: loan.copy_code, fine: totalFine }
    });

    res.json({
      success: true,
      message: totalFine > 0 ? 'Book returned. A fine has been applied.' : 'Book returned successfully',
      fine: totalFine > 0 ? { fine_id: fineId, amount: totalFine, days_overdue: daysOverdue, daily_rate: DAILY_RATE, condition_fine: conditionFine } : null,
      book: { copy_code: loan.copy_code, title: loan.title },
      returned_date: returnDate
    });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Self-service return: users return their OWN books (no condition assessment)
//
// A PHYSICAL book must never be returned by the member. The copy stays
// BORROWED until a librarian scans it at the desk, because only the librarian
// receives the book, checks its condition and can raise a damage/loss fine.
// Digital e-books have no physical item to hand over, so a member may still
// end a digital loan themselves.
exports.returnMyBook = async (req, res) => {
  try {
    if (req.user.role === 'LIBRARIAN') {
      return res.status(403).json({
        success: false,
        message: 'Librarians complete returns from the Borrow / Return page by scanning the book.'
      });
    }
    const { copy_code, copy_id } = req.body;

    // Locate the active loan for this copy
    let copyId = copy_id;
    if (copy_code) {
      const [c] = await pool.query('SELECT id FROM book_copies WHERE copy_code = ?', [copy_code]);
      if (c.length === 0) return res.status(404).json({ success: false, message: 'Copy not found' });
      copyId = c[0].id;
    }
    if (!copyId) return res.status(400).json({ success: false, message: 'copy_code or copy_id required' });

    const [loans] = await pool.query(
      `SELECT b.*, bc.book_id, bc.copy_code, bk.title, u.customer_id, u.id AS uid
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       JOIN users u ON u.id = b.user_id
       WHERE b.copy_id = ? AND b.status IN ('BORROWED','OVERDUE')
       ORDER BY b.borrow_date DESC LIMIT 1`,
      [copyId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'No active loan found for this book copy' });
    }

    const loan = loans[0];

    // Self-service users can only return their own loans
    if (loan.uid !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only return books borrowed by your account' });
    }

    // Hard-copy rule: the member cannot return a physical book themselves.
    // It stays on loan (BORROWED) until the librarian scans it in.
    const isDigital = String(loan.copy_code || '').toUpperCase().startsWith('EBK');
    if (!isDigital) {
      return res.status(403).json({
        success: false,
        message: 'Physical books must be returned at the library desk. A librarian scans the book to complete the return — until then it stays marked as borrowed.',
        requires_librarian: true,
        copy_code: loan.copy_code
      });
    }

    const returnDate = new Date();

    // Calculate overdue fine (days * daily rate)
    const { amount, daysOverdue } = calculateFine(loan.borrow_date, loan.due_date, returnDate);
    const totalFine = amount;

    // Insert return record
    const [retResult] = await pool.query(
      `INSERT INTO returns (borrowing_id, user_id, book_id, copy_id, return_date, days_overdue, fine_amount, condition_note, handled_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Self-service return', ?)`,
      [loan.id, loan.uid, loan.book_id, copyId, returnDate, daysOverdue, totalFine, req.user.id]
    );

    // Update borrowing
    await pool.query(
      `UPDATE borrowings SET returned_date = ?, status = 'RETURNED' WHERE id = ?`,
      [returnDate, loan.id]
    );

    // Update copy status
    await pool.query(`UPDATE book_copies SET status = 'AVAILABLE' WHERE id = ?`, [copyId]);

    // Update book available copies
    await pool.query(
      `UPDATE books SET available_copies = available_copies + 1 WHERE id = ?`, [loan.book_id]
    );

    // Self-service return can only ever be an OVERDUE fine: assessing a book as
    // damaged/lost is the librarian's decision at the desk, so a member can
    // never charge themselves a condition fine by self-returning.
    let fineId = null;
    if (totalFine > 0) {
      const [fineRes] = await pool.query(
        `INSERT INTO fines (user_id, borrowing_id, amount, fine_type, days_overdue, status)
         VALUES (?, ?, ?, 'OVERDUE', ?, 'UNPAID')`,
        [loan.uid, loan.id, totalFine, daysOverdue]
      );
      fineId = fineRes.insertId;
      await updateUserBlockStatus(loan.uid);
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOK_RETURNED', 'RETURN', ?, ?)`,
      [req.user.id, retResult.insertId, JSON.stringify({ copy: loan.copy_code, fine: totalFine, self_service: true }) ]
    );

    // Real-time notification
    emitToLibrarians('book_returned', {
      copy: loan.copy_code,
      fine: totalFine,
      condition: 'GOOD',
      self_service: true
    });

    const [[{ count: activeCount }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM borrowings WHERE user_id = ? AND status IN ('BORROWED','OVERDUE')`,
      [loan.uid]
    );

    res.json({
      success: true,
      message: totalFine > 0 ? `Book returned. A fine of ${totalFine} RWF has been applied for late return.` : 'Book returned successfully. You can borrow again.',
      fine: totalFine > 0 ? { fine_id: fineId, amount: totalFine, days_overdue: daysOverdue, daily_rate: DAILY_RATE } : null,
      book: { copy_code: loan.copy_code, title: loan.title },
      returned_date: returnDate,
      active_count: activeCount
    });
  } catch (err) {
    console.error('Self-return error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// List all borrowings (admin view)
exports.listBorrowings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    let params = [];
    if (status) {
      where = 'WHERE b.status = ?';
      params.push(String(status).toUpperCase());
    }

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total FROM borrowings b ${where}`, params);

    const [rows] = await pool.query(
      `SELECT b.*, u.first_name, u.last_name, u.customer_id, u.role,
              bk.title, bc.copy_code
       FROM borrowings b
       JOIN users u ON u.id = b.user_id
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       ${where}
       ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Add computed overdue info
    const enriched = rows.map(r => ({
      ...r,
      current_overdue_days: r.status === 'OVERDUE' ? getOverdueDays(r.due_date) : (r.status === 'BORROWED' ? Math.max(0, getOverdueDays(r.due_date)) : 0)
    }));

    res.json({ success: true, data: enriched, pagination: { total: count?.total || 0 } });
  } catch (err) {
    console.error('List borrowings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's own borrowing history
exports.myBorrowings = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT b.*, bk.title, bc.copy_code,
              CASE WHEN b.status = 'RETURNED' THEN r.fine_amount ELSE 0 END AS applied_fine
       FROM borrowings b
       JOIN book_copies bc ON bc.id = b.copy_id
       JOIN books bk ON bk.id = bc.book_id
       LEFT JOIN returns r ON r.borrowing_id = b.id
       WHERE b.user_id = ?
       ORDER BY b.borrow_date DESC LIMIT 50`,
      [userId]
    );

    const enriched = rows.map(r => ({
      ...r,
      current_overdue_days: !['RETURNED'].includes(r.status) ? getOverdueDays(r.due_date) : 0
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('My borrowings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
