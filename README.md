# Readify Ebook Ecommerce Website

B2C ebook ecommerce website built with Django REST Framework, React, Vite, and PostgreSQL.

## Tech Stack

- Backend: Django, Django REST Framework
- Frontend: React, Vite
- Database: PostgreSQL
- Local media: Django `MEDIA_ROOT`
- Authentication: custom Django user model with JWT cookies
- Payment: demo card flow and manual bank transfer with VietQR

## Project Structure

```text
ebook_ecommerce_website/
├── backend/
│   ├── accounts/      # Users, roles, authentication, profile
│   ├── catalog/       # Books, categories, authors, files, reviews, wishlist
│   ├── cart/          # Shopping cart
│   ├── orders/        # Checkout, orders, dashboard stats
│   ├── payments/      # Payment types and transactions
│   ├── promotions/    # Coupons and promotions
│   ├── library/       # User library, reader settings, progress, notes
│   └── media/         # Local uploaded files, ignored by Git
└── frontend/
    └── src/           # React pages, components, context, API client
```

## Core Features

- Public catalog: home page, browse page, book detail, category filtering, wishlist.
- Customer flow: register/login, profile update, password change, cart, checkout, orders, personal library, online reader, bookmarks, annotations, reading progress, reviews.
- Payment flow: demo card checkout and manual VietQR bank transfer.
- Staff/admin flow: dashboard stats, invoice/order approval, book upload and management, review moderation.
- Admin-only flow: user management, category management, promotions and coupons management.
- Promotions: direct discounts can apply by book or category; coupon codes can be entered during checkout.
- Theme: light, dark, and device/system mode.

## Business Rules

- New registered users are assigned the `Customer` role automatically.
- `username` is fixed after account creation; profile editing updates `full_name`, not `username`.
- Email and phone number must be unique across users during registration and profile/admin updates.
- A customer cannot add a book to cart if they already own it or if that book is in an active pending order.
- Pending bank-transfer orders expire after 30 minutes and become `cancelled` if payment is not confirmed.
- Order statuses are `pending`, `completed`, `cancelled`, `failed`, and `refunded`.
- A purchased book is added to the customer's library only after the order is marked `completed`.
- Reviews require purchase and reading progress rules in the app flow; public rating summaries use approved purchased reviews.
- Review statuses are `pending`, `approved`, `rejected`, `reported`, `hidden`, and `deleted`.
- Inactive books can remain visible, but unavailable actions should be blocked by the UI/API flow.

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ or compatible
- pgAdmin is optional but recommended for local database inspection

## Backend Setup

```powershell
cd D:\Project\ebook_ecommerce_website\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`:

```env
SECRET_KEY=django-insecure-change-this-key
DEBUG=True

DB_NAME=ebook_ecommerce_db
DB_USER=ebook_user
DB_PASSWORD=change_me
DB_HOST=localhost
DB_PORT=5432

PAYMENT_BANK_CODE=VCB
PAYMENT_BANK_NAME=Vietcombank
PAYMENT_BANK_ACCOUNT_NUMBER=000012345678
PAYMENT_BANK_ACCOUNT_NAME=READIFY EBOOK
PAYMENT_BANK_QR_TEMPLATE=compact2
PAYMENT_BANK_QR_BASE_URL=https://img.vietqr.io/image
```

Create the PostgreSQL database and user if they do not exist yet. Then run:

```powershell
python manage.py migrate
python manage.py seed_base
python manage.py createsuperuser
```

Run the backend:

```powershell
python manage.py runserver
```

Backend URLs:

```text
API health: http://127.0.0.1:8000/api/health/
Django Admin: http://127.0.0.1:8000/admin/
```

## Frontend Setup

```powershell
cd D:\Project\ebook_ecommerce_website\frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Run the frontend:

```powershell
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Common Local Workflow

Start backend in one terminal:

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

Start frontend in another terminal:

```powershell
cd D:\Project\ebook_ecommerce_website\frontend
npm run dev
```

## Reset Local Database Data

Use this only for local development when you want to clear business data and start fresh.

The command keeps or recreates the admin account, resets system/reference tables, and removes books, orders, transactions, carts, library data, reviews, wishlist items, promotions, and coupons.

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\python.exe manage.py reset_readify_data --admin-username admin --admin-password caominhthong
```

After reset:

- Admin login: `admin / caominhthong`
- Roles are reseeded: `Admin`, `Employee`, `Customer`
- Order statuses are reseeded: `pending`, `completed`, `cancelled`, `failed`, `refunded`
- Payment types, transaction statuses, format types, and starter categories are reseeded
- No sample books, orders, reviews, coupons, or promotions remain

Optional sample coupon:

```powershell
.\.venv\Scripts\python.exe manage.py reset_readify_data --with-sample-coupon
```

## Testing

Backend unit and integration tests use `config.test_settings`, which runs against SQLite in-memory so local tests do not require PostgreSQL test database creation permission.

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\python.exe manage.py test --settings=config.test_settings --verbosity 2
```

Backend checks:

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
```

Frontend checks:

```powershell
cd D:\Project\ebook_ecommerce_website\frontend
npm run lint
npm run build
```

Suggested functional smoke test:

1. Run backend and frontend.
2. Open `http://127.0.0.1:5173/`.
3. Verify the home page loads.
4. Click a popular category chip.
5. Verify the browser opens `/browse?category=<id>` and books are filtered.
6. Login, add a book to cart, checkout, and verify the order appears in the user order list.

## Media Storage

Do not commit real ebook files, book covers, or user avatars.

Local uploads are stored under:

```text
backend/media/
  ebooks/
    pdf/
    epub/
    mobi/
  covers/
  avatars/
```

Keep only folder placeholders such as `.gitkeep` in Git.

## Payment Notes

- Manual bank transfer currently uses VietQR from environment variables.
- Admin or employee users manually review and approve bank-transfer orders.
- Demo card checkout should store only non-sensitive payment metadata. Do not store CVV or raw card numbers.
- `payment_types` is the current source for order payment type references.

## Roles

- Customer: normal buyer and reader.
- Employee: can manage catalog/reviews/orders where allowed.
- Admin: can manage users and all admin-only sections.

New registered users are assigned the `Customer` role automatically.

## Git Workflow

Do not push directly to `main`. The repository is protected and requires Pull Requests.

Recommended branch naming:

```text
feature/<feature-name>
fix/<bug-name>
chore/<task-name>
docs/<doc-name>
test/<test-name>
```

Basic PR workflow:

```powershell
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# make changes
git status
git add .
git commit -m "Short clear message"
git push -u origin feature/your-feature-name
```

Then open a Pull Request on GitHub from your feature branch into `main`.

Before opening a Pull Request, run:

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\python.exe manage.py test --settings=config.test_settings
.\.venv\Scripts\python.exe manage.py check

cd D:\Project\ebook_ecommerce_website\frontend
npm run lint
npm run build
```

## Important Notes

- Keep `.env` files out of Git.
- Do not commit real media files from `backend/media/`.
- Commit migration files when database models change.
- Use Pull Requests for team review and CI checks.
- Resolve merge conflicts locally before asking for review.
