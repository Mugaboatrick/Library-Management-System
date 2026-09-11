# Hope Haven School Library — ERD

Generated from the live MySQL schema (15 tables). Render the Mermaid block at mermaid.live, or paste into any Markdown viewer/GitHub.

## Mermaid ER Diagram

```mermaid
erDiagram
    %% ---- Relationships ----
    roles            ||--o{ users            : "role_id"
    users            ||--o{ customer_cards   : "owns card"
    users            ||--o{ borrowings       : "borrows"
    users            ||--o{ returns          : "returns"
    users            ||--o{ fines            : "owes"
    users            ||--o{ payments         : "pays"
    users            ||--o{ bookmarks        : "bookmarks"
    users            ||--o{ audit_logs       : "logged"
    users            ||--o{ ebooks           : "uploaded_by"
    books            ||--o{ book_copies      : "has copy"
    book_copies      ||--o{ borrowings       : "loaned in"
    borrowings       ||--o{ returns          : "recorded in"
    borrowings       ||--o{ fines            : "generates"
    fines            ||--o{ payments         : "settled by"
    books            ||--o{ retired_books    : "retired"
    book_copies      ||--o{ retired_books    : "retired copy"
    books            ||--o{ returns          : "returned book"
    book_copies      ||--o{ returns          : "returned copy"
    ebooks           ||--o{ bookmarks        : "page saved"

    %% ---- users & auth ----
    users {
        int id PK
        varchar customer_id UK "STU0001"
        varchar email UK
        varchar first_name
        varchar last_name
        varchar phone
        varchar profile_image
        varchar password
        varchar role "STUDENT|TEACHER|GUEST|LIBRARIAN"
        int role_id FK
        varchar status "ACTIVE|BLOCKED"
        varchar blocked_reason
        timestamp created_at
    }
    roles {
        int id PK
        varchar name
        varchar description
    }
    customer_cards {
        int id PK
        int user_id FK
        varchar card_number UK
        varchar qr_code_url
        varchar qr_code_data
        timestamp issued_at
        timestamp expires_at
        varchar status
    }

    %% ---- catalog (physical) ----
    books {
        int id PK
        varchar title
        varchar author
        varchar category
        varchar publisher
        int publish_year
        varchar shelf_location
        int total_copies
        int available_copies
        text description
        varchar cover_image
    }
    book_copies {
        int id PK
        int book_id FK
        varchar copy_code UK "BOOK001-C1"
        varchar status "AVAILABLE|BORROWED|RETIRED"
        varchar retired_reason
    }

    %% ---- catalog (digital) ----
    ebooks {
        int id PK
        varchar title
        varchar author
        varchar subject
        varchar grade_level
        varchar file_path
        bigint file_size
        varchar format "PDF|EPUB"
        varchar cover_image
        int uploaded_by FK
        varchar status
    }
    bookmarks {
        int id PK
        int user_id FK
        int ebook_id FK
        int page_number
        text note
    }

    %% ---- circulation ----
    borrowings {
        int id PK
        int user_id FK
        int copy_id FK
        datetime borrow_date
        datetime due_date
        datetime returned_date
        varchar status "BORROWED|OVERDUE|RETURNED"
    }
    returns {
        int id PK
        int borrowing_id FK
        int user_id FK
        int book_id FK
        int copy_id FK
        datetime return_date
        int days_overdue
        decimal fine_amount
        varchar condition_note
        int handled_by
    }
    retired_books {
        int id PK
        int book_id FK
        int copy_id FK
        varchar reason "DAMAGED|LOST|DECOMMISSIONED"
        int retired_by
        varchar notes
    }

    %% ---- fines & payments ----
    fines {
        int id PK
        int user_id FK
        int borrowing_id FK
        decimal amount
        int days_overdue
        varchar status "UNPAID|PAID|WAIVED"
    }
    payments {
        int id PK
        int user_id FK
        int fine_id FK
        decimal amount
        varchar method "CASH|MOBILE|CARD"
        varchar reference
        varchar status
        datetime paid_at
        int recorded_by
    }

    %% ---- audit ----
    audit_logs {
        int id PK
        int user_id FK
        varchar action "USER_LOGIN|BOOK_BORROWED|..."
        varchar entity_type
        int entity_id
        text details
        varchar ip_address
    }
```

## Relationship map

| Table A | Relation | Table B | Via |
|---|---|---|---|
| roles | 1 — N | users | users.role_id |
| users | 1 — N | customer_cards | user_id |
| users | 1 — N | borrowings | user_id |
| books | 1 — N | book_copies | book_id |
| book_copies | 1 — N | borrowings | copy_id |
| borrowings | 1 — 1 | returns | borrowing_id |
| borrowings | 1 — N | fines | borrowing_id |
| fines | 1 — N | payments | fine_id |
| ebooks | 1 — N | bookmarks | ebook_id |
| users | 1 — N | bookmarks | user_id |
| books / book_copies | 1 — N | retired_books | book_id / copy_id |
| users | 1 — N | fines | user_id |
| users | 1 — N | payments | user_id |
| users | 1 — N | audit_logs | user_id |

## Logical modules

- **Users & Access** → `roles`, `users`, `customer_cards`
- **Books & Digital Catalog** → `books`, `book_copies`, `ebooks`, `bookmarks`
- **Circulation** → `borrowings`, `returns`, `retired_books`
- **Fine Management** → `fines`, `payments`
- **Audit & Logging** → `audit_logs`