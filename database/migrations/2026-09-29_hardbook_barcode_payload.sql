-- Add the book metadata that the Add Hard Book form already collects.
--
-- The form has always collected Subject and Level, but the books table had no
-- column for either: Subject was being written into `section` and Level was
-- dropped entirely. `section` stays as the shelving/aisle marker; `subject` and
-- `grade_level` are added as their own columns.

ALTER TABLE books
  ADD COLUMN subject VARCHAR(150) NULL AFTER category,
  ADD COLUMN grade_level VARCHAR(50) NULL AFTER section;

-- The generated barcode carries the book metadata, but book_copies.copy_code is
-- VARCHAR(30) UNIQUE and must stay a short exact-match key. The full payload is
-- stored separately so a scan can return the label's contents.
ALTER TABLE book_copies
  ADD COLUMN barcode_payload VARCHAR(255) NULL AFTER copy_code;

CREATE INDEX idx_copy_payload ON book_copies (barcode_payload);
