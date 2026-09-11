const bcrypt = require('bcryptjs');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { generateCustomerId, generateCardNumber } = require('./customerUtils');
const { generateCustomerQR } = require('./qrGenerator');
const { coversDir, ebooksDir } = require('../middleware/upload');

const DAILY_RATE = 500;

// ---------- utilities ----------
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Download helper with redirects
function download(url, dest, timeout = 15000, depth = 5) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (HopeHaven Library Seed)' }, timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth > 0) {
        res.resume();
        let next = res.headers.location;
        if (next.startsWith('/')) {
          const base = new URL(url);
          next = base.origin + next;
        }
        return resolve(download(next, dest, timeout, depth - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(false);
      }
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      let len = 0;
      res.on('data', (d) => { len += d.length; if (len > 12 * 1024 * 1024) { req.destroy(); ws.destroy(); resolve(false); } });
      ws.on('finish', () => ws.close(() => resolve(true)));
      ws.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

// Local SVG cover fallback (always works, no network needed)
function writeSvgCover(dest, title, author, color) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${color.slice(0,7)}"/>
  </linearGradient></defs>
  <rect width="300" height="450" fill="${color}"/>
  <rect x="14" y="14" width="272" height="422" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" rx="6"/>
  <text x="150" y="215" font-family="Georgia, serif" font-size="26" fill="#ffffff" text-anchor="middle" width="240">${escapeXml(title)}</text>
  <text x="150" y="255" font-family="Georgia, serif" font-size="16" fill="#dbeafe" text-anchor="middle">${escapeXml(author)}</text>
  <text x="150" y="420" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.7)" text-anchor="middle">HOPE HAVEN SCHOOL LIBRARY</text>
</svg>`;
  fs.writeFileSync(dest, svg, 'utf8');
}

// Try to download a cover; else generate SVG. Returns served URL path.
async function ensureCover(isbn, title, author, paletteIndex) {
  const colors = ['#1e3a8a', '#065f46', '#7c3aed', '#b91c1c', '#0e7490', '#a16207', '#be185d', '#374151', '#1d4ed8', '#0f766e', '#9d174d', '#44403c', '#0369a1', '#4d7c0f', '#7e1038'];
  const color = colors[paletteIndex % colors.length];

  const pngPath = path.join(coversDir, `cover_${isbn}.png`);
  const svgPath = path.join(coversDir, `cover_${isbn}.svg`);

  // Try Open Library first
  const ol = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  const ok = await download(ol, pngPath, 8000);
  if (ok) return `/uploads/covers/cover_${isbn}.png`;

  // Then a placeholder host with the title on it
  const ph = `https://placehold.co/300x450/${color.slice(1)}/ffffff?text=${encodeURIComponent(title.replace(/[^a-zA-Z0-9 ]/g, ''))}`;
  const ok2 = await download(ph, pngPath, 8000);
  if (ok2) return `/uploads/covers/cover_${isbn}.png`;

  // Local fallback
  writeSvgCover(svgPath, title, author, color);
  return `/uploads/covers/cover_${isbn}.svg`;
}

// Minimal valid PDF generator
function makePdf(title) {
  const esc = (t) => String(t).replace(/[()\\]/g, (c) => '\\' + c);
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
  const stream = `BT /F1 18 Tf 72 720 Td (${esc(title)}) Tj 0 -28 Td /F1 11 Tf (Hope Haven School Library - Digital Edition) Tj ET\n`;
  objs[4] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`;
  objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

// ---------- data ----------
const BOOKS = [
  { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', publisher: 'Scribner', publish_year: 1925, shelf: 'F-01', copies: 3, desc: 'The story of Jay Gatsby and his doomed pursuit of the American dream in 1920s New York.' },
  { isbn: '9780060935467', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', publisher: 'Harper Perennial', publish_year: 1960, shelf: 'F-02', copies: 3, desc: 'A timeless classic about race, justice and growing up in the American South.' },
  { isbn: '9780451524935', title: '1984', author: 'George Orwell', category: 'Fiction', publisher: 'Signet', publish_year: 1949, shelf: 'F-03', copies: 3, desc: 'A dystopian vision of a totalitarian future under constant surveillance.' },
  { isbn: '9780547928227', title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Adventure', publisher: 'Houghton Mifflin', publish_year: 1937, shelf: 'A-04', copies: 2, desc: 'Bilbo Baggins embarks on an unexpected journey to reclaim a lost treasure.' },
  { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', publisher: 'Penguin Classics', publish_year: 1813, shelf: 'R-01', copies: 2, desc: 'Elizabeth Bennet and Mr. Darcy navigate love, society and first impressions.' },
  { isbn: '9780452284241', title: 'Animal Farm', author: 'George Orwell', category: 'Fiction', publisher: 'Plume', publish_year: 1945, shelf: 'F-04', copies: 2, desc: 'An allegory about power, corruption and the dangers of totalitarianism.' },
  { isbn: '9780439554930', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', category: 'Fantasy', publisher: 'Scholastic', publish_year: 1997, shelf: 'G-01', copies: 3, desc: "The boy wizard's first year at Hogwarts School of Witchcraft and Wizardry." },
  { isbn: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', publisher: 'Little, Brown', publish_year: 1951, shelf: 'F-05', copies: 2, desc: 'Holden Caulfield wanders New York City in this coming-of-age classic.' },
  { isbn: '9780140283334', title: 'Lord of the Flies', author: 'William Golding', category: 'Adventure', publisher: 'Penguin', publish_year: 1954, shelf: 'A-05', copies: 2, desc: 'A group of schoolboys stranded on an island descends into savagery.' },
  { isbn: '9780061122415', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Inspiration', publisher: 'HarperOne', publish_year: 1988, shelf: 'I-01', copies: 2, desc: 'A shepherd travels to the pyramids in search of treasure and finds his personal legend.' },
  { isbn: '9780735211292', title: 'Atomic Habits', author: 'James Clear', category: 'Motivation', publisher: 'Avery', publish_year: 2018, shelf: 'M-01', copies: 2, desc: 'Small habits, big results - a proven system for building good habits and breaking bad ones.' },
  { isbn: '9780399590504', title: 'Educated', author: 'Tara Westover', category: 'Biography', publisher: 'Random House', publish_year: 2018, shelf: 'B-01', copies: 2, desc: 'A memoir of a woman who left a survivalist home to earn a PhD from Cambridge.' },
  { isbn: '9780553380163', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', publisher: 'Bantam', publish_year: 1988, shelf: 'S-01', copies: 2, desc: 'From the Big Bang to black holes, the universe explained for everyone.' },
  { isbn: '9781524763138', title: 'Becoming', author: 'Michelle Obama', category: 'Biography', publisher: 'Crown', publish_year: 2018, shelf: 'B-02', copies: 2, desc: 'The former First Lady recounts her journey from the South Side of Chicago to the White House.' },
  { isbn: '9780062316097', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'History', publisher: 'Harper', publish_year: 2011, shelf: 'H-01', copies: 2, desc: 'How homo sapiens came to dominate the planet - a sweeping history of our species.' }
];

const USERS = [
  { fn: 'Alice', ln: 'Uwase', email: 'alice@hopehaven.edu', phone: '0788333333', role: 'STUDENT' },
  { fn: 'Eric', ln: 'Mugisha', email: 'eric@hopehaven.edu', phone: '0788444444', role: 'STUDENT' },
  { fn: 'Grace', ln: 'Niyonzima', email: 'grace@hopehaven.edu', phone: '0788555555', role: 'STUDENT' },
  { fn: 'Kevin', ln: 'Habimana', email: 'kevin@hopehaven.edu', phone: '0788666666', role: 'STUDENT' },
  { fn: 'Dianah', ln: 'Ingabire', email: 'dianah@hopehaven.edu', phone: '0788777777', role: 'STUDENT' },
  { fn: 'Samuel', ln: 'Nkurunziza', email: 'samuel@hopehaven.edu', phone: '0788888888', role: 'STUDENT' },
  { fn: 'Clementine', ln: 'Uwamahoro', email: 'clementine@hopehaven.edu', phone: '0788999999', role: 'TEACHER' },
  { fn: 'Emmanuel', ln: 'Ndayisenga', email: 'emmanuel@hopehaven.edu', phone: '0790111111', role: 'TEACHER' },
  { fn: 'Beatrice', ln: 'Mukamana', email: 'beatrice@hopehaven.edu', phone: '0790222222', role: 'TEACHER' },
  { fn: 'Jean', ln: 'Bosco', email: 'jean@hopehaven.edu', phone: '0790333333', role: 'GUEST' },
  { fn: 'Aimee', ln: 'Umutoni', email: 'aimee@hopehaven.edu', phone: '0790444444', role: 'GUEST' }
];

const EBOOKS = [
  { title: 'Mathematics for Grade 7', author: 'HHS Maths Department', subject: 'Mathematics', grade: 'Grade 7', isbn: '9780010000001' },
  { title: 'English Grammar Essentials', author: 'HHS English Department', subject: 'English', grade: 'Lower Secondary', isbn: '9780010000002' },
  { title: 'Biology for Lower Secondary', author: 'HHS Science Department', subject: 'Science', grade: 'Lower Secondary', isbn: '9780010000003' },
  { title: 'Rwandan History: Kingdom to Republic', author: 'Hope Haven History Team', subject: 'History', grade: 'Upper Secondary', isbn: '9780010000004' },
  { title: 'Computer Basics for Students', author: 'HHS ICT Department', subject: 'Computing', grade: 'Grade 6-8', isbn: '9780010000005' },
  { title: 'Physics in Everyday Life', author: 'HHS Science Department', subject: 'Science', grade: 'A-Level', isbn: '9780010000006' }
];

const PASSWORD_HASHES = {
  STUDENT: null, // filled below
  TEACHER: null,
  GUEST: null
};

async function main() {
  console.log('========== Seeding full dataset ==========');

  const [booksTotal] = await pool.query('SELECT COUNT(*) AS c FROM books');
  const [borrowsTotal] = await pool.query('SELECT COUNT(*) AS c FROM borrowings');
  const [finesTotal] = await pool.query('SELECT COUNT(*) AS c FROM fines');
  const [ebooksTotal] = await pool.query('SELECT COUNT(*) AS c FROM ebooks');
  const [cardsTotal] = await pool.query('SELECT COUNT(*) AS c FROM customer_cards');
  const [paymentsTotal] = await pool.query('SELECT COUNT(*) AS c FROM payments');
  const [retiredTotal] = await pool.query('SELECT COUNT(*) AS c FROM retired_books');

  PASSWORD_HASHES.STUDENT = await bcrypt.hash('student123', 10);
  PASSWORD_HASHES.TEACHER = await bcrypt.hash('teacher123', 10);
  PASSWORD_HASHES.GUEST = await bcrypt.hash('guest123', 10);

  // ---------- 1) Books + covers + copies ----------
  let addedBooks = 0;
  const bookIds = {};
  for (let i = 0; i < BOOKS.length; i++) {
    const b = BOOKS[i];
    const [exist] = await pool.query('SELECT id FROM books WHERE title = ?', [b.title]);
    if (exist.length > 0) { bookIds[b.isbn] = exist[0].id; console.log(`skip book (exists): ${b.title}`); continue; }

    const cover = await ensureCover(b.isbn, b.title, b.author, i);
    await sleep(150);
    const [res] = await pool.query(
      `INSERT INTO books (title, author, category, publisher, publish_year, shelf_location, total_copies, available_copies, description, cover_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.title, b.author, b.category, b.publisher, b.publish_year, b.shelf, b.copies, b.copies, b.desc, cover]
    );
    const bookId = res.insertId;
    bookIds[b.isbn] = bookId;

    const params = [];
    for (let c = 1; c <= b.copies; c++) {
      params.push([bookId, `BOOK${String(bookId).padStart(3, '0')}-C${c}`, 'AVAILABLE']);
    }
    await pool.query('INSERT INTO book_copies (book_id, copy_code, status) VALUES ?', [params]);
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (1, 'BOOK_ADDED', 'BOOK', ?, ?)`,
      [bookId, `${b.title}, ${b.copies} copies`]
    );
    addedBooks++;
    console.log(`✔ book added: ${b.title} [cover: ${cover}]`);
  }
  console.log(`Books added: ${addedBooks} (total now ${booksTotal[0].c + addedBooks})`);

  // ---------- 2) Users + QR cards ----------
  const usersByEmail = {};
  const [existing] = await pool.query('SELECT * FROM users');
  existing.forEach((u) => { usersByEmail[u.email.toLowerCase()] = u; });

  let addedUsers = 0;
  for (const u of USERS) {
    const key = u.email.toLowerCase();
    if (usersByEmail[key]) { console.log(`skip user (exists): ${u.email}`); continue; }

    const customerId = await generateCustomerId(u.role);
    const hashed = PASSWORD_HASHES[u.role];
    const [res] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [u.fn, u.ln, u.email, u.phone, hashed, u.role, customerId]
    );
    const userId = res.insertId;
    const cardNumber = generateCardNumber(customerId);
    const qr = await generateCustomerQR(customerId, userId, {
      full_name: `${u.fn} ${u.ln}`.trim(),
      role: u.role,
      email: u.email,
      phone: u.phone || undefined,
      card_number: cardNumber
    });
    await pool.query(
      `INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [userId, cardNumber, qr.url, qr.data]
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (1, 'USER_CREATED', 'USER', ?, ?)`,
      [userId, `Seeded ${u.role} ${customerId}`]
    );
    usersByEmail[key] = { id: userId, customer_id: customerId, role: u.role, first_name: u.fn, last_name: u.ln, email: u.email };
    addedUsers++;
    console.log(`✔ user added: ${u.fn} ${u.ln} (${customerId})`);
  }
  console.log(`Users added: ${addedUsers}`);
  const user = (email) => usersByEmail[email.toLowerCase()];

  // ---------- 3) Borrowings / returns / fines / payments ----------
  if (borrowsTotal[0].c === 0) {
    const lib = user('librarian@hopehaven.edu');
    if (!lib) throw new Error('Librarian missing');

    // helper: insert a borrowing + optional return + optional fine/payment
    // `overDays` = days overdue at return (0 = on time). negative => returned early.
    const addBorrow = async ({ userEmail, isbn, copiesAgo, borrowDaysAgo, dueDays, returned, overDays, handledBy }) => {
      const u = user(userEmail);
      const bookId = bookIds[isbn];
      if (!u || !bookId) { console.log('   ! cannot borrow for missing ref'); return null; }

      // pick an AVAILABLE copy
      const [copies] = await pool.query(
        `SELECT id, copy_code FROM book_copies WHERE book_id = ? AND status = 'AVAILABLE' ORDER BY id LIMIT 1`,
        [bookId]
      );
      if (copies.length === 0) { console.log(`   ! no available copy for ${isbn}`); return null; }
      const copy = copies[0];

      const borrowDate = new Date(Date.now() - copiesAgo * 86400000);
      const dueDate = new Date(borrowDate.getTime() + dueDays * 86400000);

      if (returned) {
        // borrowing is already completed
        const status = 'RETURNED';
        const returnDate = new Date(borrowDate.getTime() + dueDays * 86400000 + overDays * 86400000);
        await pool.query(`UPDATE book_copies SET status = 'AVAILABLE' WHERE id = ?`, [copy.id]);
        const [r] = await pool.query(
          `INSERT INTO borrowings (user_id, copy_id, borrow_date, due_date, returned_date, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.id, copy.id, borrowDate, dueDate, returnDate, status]
        );
        const daysOverdue = overDays > 0 ? overDays : 0;
        const fine = daysOverdue * DAILY_RATE;
        await pool.query(
          `INSERT INTO returns (borrowing_id, user_id, book_id, copy_id, return_date, days_overdue, fine_amount, condition_note, handled_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.insertId, u.id, bookId, copy.id, returnDate, daysOverdue, fine, overDays > 0 ? 'Returned after due date' : 'Returned in good condition', handledBy]
        );
        // close the loan: return fine (0 fine -> no fine row)
        if (fine > 0) {
          const [fr] = await pool.query(
            `INSERT INTO fines (user_id, borrowing_id, amount, days_overdue, status) VALUES (?, ?, ?, ?, 'UNPAID')`,
            [u.id, r.insertId, fine, daysOverdue]
          );
          return { borrowId: r.insertId, fineId: fr.insertId, fine, copyCode: copy.copy_code };
        }
        return { borrowId: r.insertId, fineId: null, fine: 0, copyCode: copy.copy_code };
      } else {
        // active loan
        const status = dueDate < new Date() ? 'OVERDUE' : 'BORROWED';
        await pool.query(`UPDATE book_copies SET status = ? WHERE id = ?`, [status === 'OVERDUE' ? 'OVERDUE' : 'BORROWED', copy.id]);
        const [r] = await pool.query(
          `INSERT INTO borrowings (user_id, copy_id, borrow_date, due_date, status)
           VALUES (?, ?, ?, ?, ?)`,
          [u.id, copy.id, borrowDate, dueDate, status]
        );
        let fineId = null;
        if (status === 'OVERDUE') {
          const days = Math.max(1, Math.ceil((Date.now() - dueDate.getTime()) / 86400000));
          const [fr] = await pool.query(
            `INSERT INTO fines (user_id, borrowing_id, amount, days_overdue, status) VALUES (?, ?, ?, ?, 'UNPAID')`,
            [u.id, r.insertId, days * DAILY_RATE, days]
          );
          fineId = fr.insertId;
        }
        return { borrowId: r.insertId, fineId, fine: 0, copyCode: copy.copy_code };
      }
    };

    const payFine = async (fineId, userId, amount, method, refund) => {
      await pool.query(
        `INSERT INTO payments (user_id, fine_id, amount, method, reference, status, recorded_by, paid_at) VALUES (?, ?, ?, ?, ?, 'COMPLETED', 1, ?)`,
        [userId, fineId, amount, method, refund, new Date(Date.now() - 2 * 86400000)]
      );
      await pool.query(`UPDATE fines SET status = 'PAID', updated_at = NOW() WHERE id = ?`, [fineId]);
    };

    // STU0001 John Doe
    await addBorrow({ userEmail: 'student@hopehaven.edu', isbn: '9780743273565', copiesAgo: 45, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });
    await addBorrow({ userEmail: 'student@hopehaven.edu', isbn: '9780060935467', copiesAgo: 40, dueDays: 14, returned: true, overDays: 21, handledBy: 1 });
    await addBorrow({ userEmail: 'student@hopehaven.edu', isbn: '9780547928227', copiesAgo: 3, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // TCH0001 Jane Smith
    await addBorrow({ userEmail: 'teacher@hopehaven.edu', isbn: '9780141439518', copiesAgo: 20, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });
    await addBorrow({ userEmail: 'teacher@hopehaven.edu', isbn: '9780452284241', copiesAgo: 25, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Alice Uwase
    await addBorrow({ userEmail: 'alice@hopehaven.edu', isbn: '9780061122415', copiesAgo: 30, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });
    const aliceBorrow = await addBorrow({ userEmail: 'alice@hopehaven.edu', isbn: '9780735211292', copiesAgo: 5, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Eric Mugisha -> overdue-on-return with paid fine
    const ericFine = await addBorrow({ userEmail: 'eric@hopehaven.edu', isbn: '9780316769488', copiesAgo: 30, dueDays: 14, returned: true, overDays: 3, handledBy: 1 });
    if (ericFine && ericFine.fineId) {
      await payFine(ericFine.fineId, user('eric@hopehaven.edu').id, ericFine.fine, 'MOBILE_MONEY', 'RCPT-2026-0041');
    }
    await addBorrow({ userEmail: 'eric@hopehaven.edu', isbn: '9780140283334', copiesAgo: 6, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Grace Niyonzima -> currently overdue
    await addBorrow({ userEmail: 'grace@hopehaven.edu', isbn: '9780451524935', copiesAgo: 25, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Kevin Habimana -> big unpaid fine -> BLOCKED
    const kevinFine = await addBorrow({ userEmail: 'kevin@hopehaven.edu', isbn: '9780553380163', copiesAgo: 40, dueDays: 14, returned: true, overDays: 12, handledBy: 1 });
    await pool.query(
      `UPDATE users SET status = 'BLOCKED', blocked_reason = 'Outstanding fines exceeded threshold (5000 RWF)' WHERE id = ?`,
      [user('kevin@hopehaven.edu').id]
    );

    // Dianah Ingabire -> damaged + overdue -> waived
    const dianahFine = await addBorrow({ userEmail: 'dianah@hopehaven.edu', isbn: '9780399590504', copiesAgo: 35, dueDays: 14, returned: true, overDays: 4, handledBy: 1 });
    if (dianahFine && dianahFine.fineId) {
      const damage = 10000;
      await pool.query(`UPDATE fines SET amount = amount + ?, created_at = NOW() WHERE id = ?`, [damage, dianahFine.fineId]);
      await pool.query(`UPDATE returns SET fine_amount = fine_amount + ?, condition_note = 'Ripped cover (damaged condition)' WHERE borrowing_id = ?`, [damage, dianahFine.borrowId]);
      await pool.query(`UPDATE fines SET status = 'WAIVED', updated_at = NOW() WHERE id = ?`, [dianahFine.fineId]);
    }

    // Samuel Nkurunziza
    await addBorrow({ userEmail: 'samuel@hopehaven.edu', isbn: '9781524763138', copiesAgo: 8, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });
    await addBorrow({ userEmail: 'samuel@hopehaven.edu', isbn: '9780062316097', copiesAgo: 15, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });

    // Clementine Uwamahoro (teacher)
    await addBorrow({ userEmail: 'clementine@hopehaven.edu', isbn: '9780439554930', copiesAgo: 4, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });
    await addBorrow({ userEmail: 'clementine@hopehaven.edu', isbn: '9780140283334', copiesAgo: 12, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });

    // Emmanuel Ndayisenga -> small overdue fine -> waived
    const emmanuelFine = await addBorrow({ userEmail: 'emmanuel@hopehaven.edu', isbn: '9780061122415', copiesAgo: 30, dueDays: 14, returned: true, overDays: 2, handledBy: 1 });
    if (emmanuelFine && emmanuelFine.fineId) {
      await pool.query(`UPDATE fines SET status = 'WAIVED', updated_at = NOW() WHERE id = ?`, [emmanuelFine.fineId]);
    }

    // Beatrice Mukamana (teacher)
    await addBorrow({ userEmail: 'beatrice@hopehaven.edu', isbn: '9780735211292', copiesAgo: 10, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Jean Bosco (guest)
    await addBorrow({ userEmail: 'jean@hopehaven.edu', isbn: '9780060935467', copiesAgo: 2, dueDays: 14, returned: false, overDays: 0, handledBy: 1 });

    // Aimee Umutoni (guest)
    await addBorrow({ userEmail: 'aimee@hopehaven.edu', isbn: '9780451524935', copiesAgo: 9, dueDays: 14, returned: true, overDays: 0, handledBy: 1 });

    // fix the bogus Jean isbn deletion side-effects (we deleted rows we inserted above) then re-computed availability at end
    console.log('✔ borrowings seeded');
  } else {
    console.log('skip borrowings (table not empty)');
  }

  // ---------- 4) Retired book copy ----------
  if (retiredTotal[0].c === 0 && bookIds['9780316769488']) {
    const [copyRow] = await pool.query(
      `SELECT id FROM book_copies WHERE book_id = ? AND status = 'AVAILABLE' ORDER BY id LIMIT 1`,
      [bookIds['9780316769488']]
    );
    if (copyRow.length) {
      await pool.query(`UPDATE book_copies SET status = 'RETIRED', retired_reason = 'DAMAGED' WHERE id = ?`, [copyRow[0].id]);
      await pool.query(
        `INSERT INTO retired_books (book_id, copy_id, reason, retired_by, notes) VALUES (?, ?, 'DAMAGED', 1, 'Pages water-damaged during circulation')`,
        [bookIds['9780316769488'], copyRow[0].id]
      );
      console.log('✔ retired book copy seeded');
    }
  }

  // ---------- 5) Reconcile book counts for full consistency ----------
  await pool.query(
    `UPDATE books b SET
       total_copies = (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id),
       available_copies = (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'AVAILABLE')`
  );

  // ---------- 6) E-books + bookmarks ----------
  if (ebooksTotal[0].c === 0) {
    for (let i = 0; i < EBOOKS.length; i++) {
      const e = EBOOKS[i];
      const buf = makePdf(e.title);
      const filename = `ebook_${Date.now()}_seed_${i}.pdf`;
      fs.writeFileSync(path.join(ebooksDir, filename), buf);
      const cover = await ensureCover(e.isbn, e.title, e.author, i);
      await sleep(100);
      const [res] = await pool.query(
        `INSERT INTO ebooks (title, author, subject, grade_level, file_path, file_size, format, cover_image, uploaded_by, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PDF', ?, 1, 'ACTIVE')`,
        [e.title, e.author, e.subject, e.grade, filename, buf.length, cover]
      );
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (1, 'EBOOK_UPLOADED', 'EBOOK', ?, ?)`,
        [res.insertId, e.title]
      );
    }
    console.log('✔ e-books seeded');

    const [ebookRows] = await pool.query('SELECT id FROM ebooks ORDER BY id LIMIT 3');
    const addBookmark = async (email, ebookIndex, page) => {
      const u = user(email);
      if (!u || !ebookRows[ebookIndex]) return;
      await pool.query(
        `INSERT INTO bookmarks (user_id, ebook_id, page_number, note) VALUES (?, ?, ?, ?)`,
        [u.id, ebookRows[ebookIndex].id, page, `Reading note - page ${page}`]
      );
    };
    await addBookmark('student@hopehaven.edu', 0, 24);
    await addBookmark('alice@hopehaven.edu', 1, 12);
    await addBookmark('clementine@hopehaven.edu', 2, 40);
    console.log('✔ bookmarks seeded');
  } else {
    console.log('skip e-books (table not empty)');
  }

  console.log('\n========== Seeding complete ==========');
  process.exit(0);
}

main().catch((e) => {
  console.error('SEED FAILED:', e);
  process.exit(1);
});