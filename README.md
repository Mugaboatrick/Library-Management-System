# Hope Haven Smart Library Management & E-Book System

A full-stack web application for managing a modern school library: physical book inventory, QR-code access cards, borrowing/returning, automatic fine calculation, and an online e-book reading platform.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React.js, Tailwind CSS, React Router, Axios     |
| Backend   | Node.js, Express.js, JWT Authentication          |
| Database  | MySQL                                           |
| Extra     | QR Code Generation, QR Scanning, PDF Reader, Cron Jobs for Fines, File Uploads |

## Features by Role

### Librarian (Administrator)
- Login
- Manage users (students/teachers/guests)
- Manage books & copies, retire books (DAMAGED / LOST / DECOMMISSIONED)
- Generate & regenerate QR access cards
- Borrow & return books (QR workflow)
- Upload e-books (PDF/EPUB)
- Manage & record fines and payments
- View reports & audit logs

### Student
- Register / Login
- Borrow up to **3** books
- View QR card, search books, read e-books, history, fines

### Teacher
- Register / Login
- Borrow up to **10** books
- View QR card, search books, read e-books, history, fines

### Guest
- Temporary account (created by librarian)
- Borrow only **1** book
- View QR card, search books, read e-books

## Borrowing Rules
- Scan customer QR → verify user → check fine status → scan book → create loan → generate due date
- Student = 3 books, Teacher = 10, Guest = 1

## Fine Calculation
- Formula: `Fine = Overdue Days × Daily Rate` (default 500 RWF/day)
- If unpaid fines exceed the threshold, the account is **BLOCKED**
- Payment methods: Cash, Mobile Money, Bank Transfer

## Project Structure

```
part/
├── backend/                 # Node.js + Express API
│   ├── config/db.js         # MySQL pool
│   ├── controllers/         # auth, user, book, borrow, fine, ebook, report
│   ├── middleware/          # auth (JWT), upload (multer)
│   ├── routes/              # API routes
│   ├── utils/               # QR generator, customer id, fine utils, seed
│   ├── cron/fineCron.js     # daily fine calculation
│   ├── uploads/             # uploaded ebook files & QR images
│   ├── .env                 # configuration
│   └── server.js            # entry point
├── frontend/                # React + Tailwind
│   └── src/
│       ├── components/      # layout, common
│       ├── context/         # AuthContext
│       ├── pages/           # auth, admin, user pages
│       ├── services/        # axios API services
│       └── App.js
└── database/
    ├── schema.sql           # creates DB + 13 tables
    └── seed.sql             # demo users/roles/books with real hashes
```

## Database Tables (13)
`roles`, `users`, `customer_cards`, `books`, `book_copies`, `borrowings`, `returns`, `fines`, `payments`, `ebooks`, `bookmarks`, `retired_books`, `audit_logs`

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL Server (running on localhost:3306)

### 1. Create the Database

Open a MySQL client (e.g. MySQL Workbench or CLI) and run:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

This creates the `hope_haven_library` database with all tables and demo data.

### 2. Configure Backend

Edit `backend/.env` and set your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hope_haven_library
DB_PORT=3306

JWT_SECRET=change_this_to_a_long_random_string
DAILY_FINE_RATE=500
FINE_BLOCK_THRESHOLD=5000
```

### 3. Install & Start Backend

```bash
cd backend
npm install
npm start        # or: npm run dev  (nodemon)
```

Server runs on **http://localhost:5000**

(Optional) Use the seed script instead of the SQL seed:
```bash
npm run seed
```

### 4. Install & Start Frontend

```bash
cd frontend
npm install
npm start        # runs on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Demo Accounts

| Role      | Email                         | Password    |
|-----------|-------------------------------|-------------|
| Librarian | librarian@hopehaven.edu       | admin123    |
| Student   | student@hopehaven.edu         | student123  |
| Teacher   | teacher@hopehaven.edu         | teacher123  |
| Guest     | guest@hopehaven.edu           | guest123    |

---

## API Overview (Base URL: `http://localhost:5000/api`)

| Method | Endpoint                     | Access       | Description |
|--------|------------------------------|--------------|-------------|
| POST   | /auth/register               | public       | Register student/teacher |
| POST   | /auth/login                  | public       | Login, returns JWT |
| GET    | /auth/me                     | any          | Current profile + QR card |
| PUT    | /auth/change-password        | any          | Change password |
| GET/POST | /users                     | librarian    | Manage users |
| PUT    | /users/:id/block             | librarian    | Block/unblock |
| POST   | /users/:id/qrcards/regenerate| librarian    | Regenerate QR card |
| GET/POST | /books                     | all read / lib write | Book inventory |
| POST   | /books/:id/copies            | librarian    | Add copies |
| PUT    | /books/retire/:id            | librarian    | Retire a copy |
| POST   | /borrowings/borrow           | librarian    | Borrow book |
| POST   | /borrowings/return           | librarian    | Return book (calc fine) |
| GET    | /borrowings/mine             | any          | My borrow history |
| GET/POST | /fines                     | lib / own     | Fines management |
| POST   | /fines/:fine_id/pay          | librarian    | Record payment |
| GET/POST | /ebooks                    | all read / lib write | E-book library |
| GET    | /ebooks/:id/read             | protected    | Stream PDF/EPUB (auth) |
| POST   | /ebooks/bookmarks            | any          | Save bookmark |
| GET    | /reports/dashboard           | librarian    | Dashboard stats |
| GET    | /reports/most-borrowed       | librarian    | Most borrowed books |
| GET    | /reports/monthly-trends      | librarian    | Monthly trend |
| GET    | /reports/audit-logs          | librarian    | Audit trail |
| POST   | /reports/run-fine-cron       | librarian    | Run fine cron manually |

---

## Notes
- The fine-cron job runs automatically every day at midnight (node-cron) and can also be triggered manually via `POST /api/reports/run-fine-cron`.
- The e-book reader serves files through a protected, authenticated API (direct file URLs are not exposed). Right-click is disabled in the reader for content protection.
- QR cards are generated automatically on registration and can be regenerated by the librarian.
