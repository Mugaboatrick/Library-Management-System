-- ============================================================
-- Hope Haven Library - Seed Data (run AFTER schema.sql)
-- Demo users with real bcrypt password hashes:
--   librarian@hopehaven.edu / admin123
--   student@hopehaven.edu  / student123
--   teacher@hopehaven.edu  / teacher123
-- ============================================================
USE hope_haven_library;

-- Roles
INSERT INTO roles (name, description) VALUES
  ('LIBRARIAN', 'System administrator'),
  ('STUDENT', 'Student borrower'),
  ('TEACHER', 'Teacher borrower'),
  ('GUEST', 'Temporary guest borrower')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Demo Users
INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status) VALUES
  ('System', 'Administrator', 'librarian@hopehaven.edu', '0788000000', '$2a$10$H6du/YHMa6XGIpODhx3Gp.ilq1WjX9QgqnY1OulsHEuftVDCFDSdm', 'LIBRARIAN', 'LIB0001', 'ACTIVE'),
  ('John', 'Doe', 'student@hopehaven.edu', '0788111111', '$2a$10$rC/iwgK4Z1CfTiPV73lboOku/4hLK8jaVDX3vJzh5Y64ROIvuzkyO', 'STUDENT', 'STU0001', 'ACTIVE'),
  ('Jane', 'Smith', 'teacher@hopehaven.edu', '0788222222', '$2a$10$0fy60/ec1Ux20j9wIJ1.cOWUa2r5MYWAQDvKBXQ3W5e7le6QkJ.Gu', 'TEACHER', 'TCH0001', 'ACTIVE'),
  ('Alice', 'Guest', 'guest@hopehaven.edu', '0788333333', '$2a$10$MoscOYxyx18Csjo8A/IscOHH4vhNMejJBehpRKrMIF0fuTaQUKGUe', 'GUEST', 'GST0001', 'ACTIVE')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Customer cards (QR will be auto-generated on next login/regeneration by the API,
-- but we create placeholder card records so /api/auth/me can return a card)
INSERT INTO customer_cards (user_id, card_number, qr_code_url, qr_code_data, status)
SELECT u.id, CONCAT('HH-', u.customer_id, '-SEED'), NULL, CONCAT('{"customer_id":"', u.customer_id, '","uid":', u.id, '}'), 'ACTIVE'
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM customer_cards cc WHERE cc.user_id = u.id);

-- Sample Books
INSERT INTO books (isbn, title, author, category, publisher, publish_year, shelf_location, total_copies, available_copies, description) VALUES
  ('9780000000001', 'Mathematics Grade 6', 'A. Ngabo', 'Mathematics', 'Hope Press', 2021, 'A-1', 3, 3, 'Primary mathematics textbook'),
  ('9780000000002', 'English Literature', 'B. Uwera', 'English', 'Hope Press', 2020, 'B-2', 2, 2, 'English literature anthology'),
  ('9780000000003', 'Physics Basics', 'C. Mugisha', 'Science', 'National Pub', 2022, 'C-3', 4, 4, 'Introductory physics'),
  ('9780000000004', 'World History', 'D. Bizimana', 'History', 'Hope Press', 2019, 'D-1', 2, 2, 'World history survey'),
  ('9780000000005', 'Computer Science', 'E. Niyonzima', 'Technology', 'Tech Books', 2023, 'E-2', 3, 3, 'Introduction to computing');

-- Create copies for each book if not present
INSERT INTO book_copies (book_id, copy_code, status)
SELECT b.id, CONCAT('BOOK', LPAD(b.id, 3, '0'), '-C', c.n), 'AVAILABLE'
FROM books b
JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) c
  ON c.n <= b.total_copies
WHERE NOT EXISTS (
  SELECT 1 FROM book_copies bc
  WHERE bc.book_id = b.id AND bc.copy_code = CONCAT('BOOK', LPAD(b.id, 3, '0'), '-C', c.n)
);

SELECT 'Seed data loaded successfully.' AS result;
