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
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT', -- STUDENT | TEACHER | GUEST | LIBRARIAN
  role_id INT,
  customer_id VARCHAR(20) NOT NULL UNIQUE,     -- STU0001 / TCH0001 / GST0001
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
-- 5. book_copies (each copy has unique code)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_copies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  copy_code VARCHAR(30) NOT NULL UNIQUE,     -- BOOK001-C1
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | BORROWED | RETIRED
  retired_reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
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
  grade_level VARCHAR(50),
  isbn VARCHAR(50),
  file_path VARCHAR(500),
  file_size BIGINT,
  format VARCHAR(10),  -- PDF | EPUB
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

