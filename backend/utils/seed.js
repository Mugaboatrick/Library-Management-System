const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateCustomerId } = require('./customerUtils');

// Seed script: creates default users with proper bcrypt hashes
async function seed() {
  try {
    console.log('Seeding database...');

    // Ensure roles exist
    await pool.query(`INSERT IGNORE INTO roles (name, description) VALUES
      ('LIBRARIAN', 'System administrator'),
      ('STUDENT', 'Student borrower'),
      ('TEACHER', 'Teacher borrower'),
      ('GUEST', 'Temporary guest borrower')`);

    // Librarian
    const libPassword = await bcrypt.hash('admin123', 10);
    const libId = await generateCustomerId('LIBRARIAN');

    // Check if librarian exists
    const [libExist] = await pool.query(
      `SELECT id FROM users WHERE email = ?`, ['librarian@hopehaven.edu']
    );
    if (libExist.length === 0) {
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
         VALUES ('System', 'Administrator', 'librarian@hopehaven.edu', '0788000000', ?, 'LIBRARIAN', ?, 'ACTIVE')`,
        [libPassword, libId]
      );
      console.log('✔ Librarian created (librarian@hopehaven.edu / admin123)');
    }

    // Student
    const stuPassword = await bcrypt.hash('student123', 10);
    const stuId = await generateCustomerId('STUDENT');
    const [stuExist] = await pool.query(
      `SELECT id FROM users WHERE email = ?`, ['student@hopehaven.edu']
    );
    if (stuExist.length === 0) {
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
         VALUES ('John', 'Doe', 'student@hopehaven.edu', '0788111111', ?, 'STUDENT', ?, 'ACTIVE')`,
        [stuPassword, stuId]
      );
      console.log('✔ Student created (student@hopehaven.edu / student123)');
    }

    // Teacher
    const tchPassword = await bcrypt.hash('teacher123', 10);
    const tchId = await generateCustomerId('TEACHER');
    const [tchExist] = await pool.query(
      `SELECT id FROM users WHERE email = ?`, ['teacher@hopehaven.edu']
    );
    if (tchExist.length === 0) {
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, phone, password, role, customer_id, status)
         VALUES ('Jane', 'Smith', 'teacher@hopehaven.edu', '0788222222', ?, 'TEACHER', ?, 'ACTIVE')`,
        [tchPassword, tchId]
      );
      console.log('✔ Teacher created (teacher@hopehaven.edu / teacher123)');
    }

    console.log('Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
