-- ============================================================
-- Hope Haven Smart Library Management & E-Book System
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS hope_haven_library;
USE hope_haven_library;

-- ------------------------------------------------------------
-- 1. roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. users (all customer types)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  class_name VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT', -- STUDENT | TEACHER | GUEST | LIBRARIAN
  role_id INT,
  customer_id VARCHAR(20) NOT NULL UNIQUE,     -- STU0001 / TCH0001 / GST0001
  physical_card_no VARCHAR(50) NULL,           -- legacy numeric card serials such as 19989204
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | BLOCKED | SUSPENDED
  blocked_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. customer_cards (QR Access Cards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_number VARCHAR(50) NOT NULL UNIQUE,
  qr_code_url VARCHAR(500),
  qr_code_data VARCHAR(500),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. books
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  isbn VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  category VARCHAR(100),
  subject VARCHAR(150),
  section VARCHAR(100),
  grade_level VARCHAR(50),
  publisher VARCHAR(150),
  publish_year INT,
  shelf_location VARCHAR(50),
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4b. categories (library catalog categories: CCB, Nov Books, Reference, Biblical)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,       -- short code e.g. CCB, NOV, REF, BIB
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4c. subjects (subjects under each category, at levels S1-S6)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  level VARCHAR(5) NOT NULL DEFAULT 'S1',  -- S1 | S2 | S3 | S4 | S5 | S6
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cat_subject_level (category_id, name, level)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. book_copies (each copy has unique code)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_copies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  copy_code VARCHAR(30) NOT NULL UNIQUE,     -- BOOK001-C1
  -- Printed-label payload: HH1|<copyCode>|<title>|<author>|<category>|<subject>|<level>|<shelf>
  barcode_payload VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | BORROWED | RETIRED
  retired_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_copy_payload (barcode_payload)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. borrowings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrowings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  copy_id INT NOT NULL,
  borrow_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  returned_date DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'BORROWED', -- BORROWED | RETURNED | OVERDUE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (copy_id) REFERENCES book_copies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. returns
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  borrowing_id INT NOT NULL,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  copy_id INT NOT NULL,
  return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  days_overdue INT DEFAULT 0,
  fine_amount DECIMAL(10,2) DEFAULT 0,
  condition_note VARCHAR(255),
  handled_by INT, -- librarian user id
  FOREIGN KEY (borrowing_id) REFERENCES borrowings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (copy_id) REFERENCES book_copies(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. fines
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  borrowing_id INT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  days_overdue INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- UNPAID | PAID | WAIVED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (borrowing_id) REFERENCES borrowings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. payments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fine_id INT,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL,  -- CASH | MOBILE_MONEY | BANK_TRANSFER
  reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'COMPLETED',
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recorded_by INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (fine_id) REFERENCES fines(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. ebooks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ebooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  subject VARCHAR(150),
  section VARCHAR(100),
  grade_level VARCHAR(50),
  isbn VARCHAR(50),
  qr_code VARCHAR(500),
  file_path VARCHAR(500),
  file_size BIGINT,
  format VARCHAR(10),  -- PDF | EPUB
  is_protected TINYINT(1) DEFAULT 0,  -- 1 = DRM-protected: students can read online but cannot download or copy
  access_mode VARCHAR(20) NOT NULL DEFAULT 'READ_ONLY',  -- READ_ONLY | READ_BORROW | BORROW_ONLY
  cover_image VARCHAR(500),
  uploaded_by INT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. bookmarks (e-reader bookmarks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ebook_id INT NOT NULL,
  page_number INT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ebook_id) REFERENCES ebooks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 12. retired_books (retirement history preserved)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retired_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT,
  copy_id INT,
  reason VARCHAR(50) NOT NULL,  -- DAMAGED | LOST | DECOMMISSIONED
  retired_by INT,
  notes VARCHAR(255),
  retired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
  FOREIGN KEY (copy_id) REFERENCES book_copies(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 13. audit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INT,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 14. notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. OVERDUE | REMINDER | APPROVED | REJECTED
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  sender_deleted TINYINT(1) NOT NULL DEFAULT 0,
  recipient_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_msg_sender (sender_id, sender_deleted, created_at),
  INDEX idx_msg_recipient (recipient_id, is_read)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Categories: professional catalog categories (CCB, Nov, Reference, Biblical)
-- ------------------------------------------------------------
INSERT IGNORE INTO categories (name, code, description) VALUES
  ('CCB', 'CCB', 'Classical Conversations Books'),
  ('Nov Books', 'NOV', 'Novel books'),
  ('Reference Books', 'REF', 'Reference and dictionary books'),
  ('Biblical Books', 'BIB', 'Biblical and spiritual books');

-- ------------------------------------------------------------
-- Subjects per category at levels S1-S6
-- (INSERT IGNORE skips (category, name, level) combos already present)
-- ------------------------------------------------------------
INSERT IGNORE INTO subjects (category_id, name, level)
SELECT c.id, s.name, l.level
FROM categories c
CROSS JOIN (
  SELECT 'Kinyarwanda' AS name UNION SELECT 'English' UNION SELECT 'French' UNION
  SELECT 'Maths' UNION SELECT 'Physics' UNION SELECT 'Biology' UNION SELECT 'Chemistry' UNION
  SELECT 'ICT' UNION SELECT 'Entrepreneurships' UNION SELECT 'History' UNION SELECT 'Geography' UNION
  SELECT 'Literature' UNION SELECT 'Religion' UNION SELECT 'General'
) s
CROSS JOIN (SELECT 'S1' AS level UNION SELECT 'S2' UNION SELECT 'S3' UNION SELECT 'S4' UNION SELECT 'S5' UNION SELECT 'S6') l;

-- ============================================================
-- Seed Data
-- NOTE: Demo users, cards, and sample books are inserted by
-- running database/seed.sql AFTER this schema. Do not insert
-- users here (bcrypt hashes are generated in seed.sql).
-- ============================================================

INSERT INTO roles (name, description) VALUES
  ('LIBRARIAN', 'System administrator'),
  ('STUDENT', 'Student borrower'),
  ('TEACHER', 'Teacher borrower'),
  ('GUEST', 'Temporary guest borrower')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Sample Books (optional starter data)
-- ============================================================
INSERT IGNORE INTO books (isbn, title, author, category, publisher, publish_year, shelf_location, total_copies, available_copies)
VALUES
  ('9780000000001', 'Mathematics Grade 6', 'Author A', 'Mathematics', 'Hope Press', 2021, 'A-1', 3, 3),
  ('9780000000002', 'English Literature', 'Author B', 'English', 'Hope Press', 2020, 'B-2', 2, 2),
  ('9780000000003', 'Physics Basics', 'Author C', 'Science', 'National Pub', 2022, 'C-3', 4, 4);

-- Create copies for sample books if they don't exist
INSERT IGNORE INTO book_copies (book_id, copy_code, status)
SELECT b.id, CONCAT('BOOK', LPAD(b.id, 3, '0'), '-C', c.n), 'AVAILABLE'
FROM books b
JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) c
  ON c.n <= b.total_copies;

