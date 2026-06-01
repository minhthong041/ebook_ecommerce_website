# Ebook Ecommerce Website

B2C ebook ecommerce website built with Django, Django REST Framework, PostgreSQL, React, and Vite.

## Project Structure

```text
ebook_ecommerce_website/
├── backend/   # Django API, PostgreSQL models, Django Admin
└── frontend/  # React app powered by Vite
```

## Current Status

- Backend project is configured with PostgreSQL.
- Custom user model is enabled through `AUTH_USER_MODEL = "accounts.User"`.
- Core database models and Django Admin are available for accounts, catalog, cart, orders, payments, promotions, and library.
- React can call the backend health endpoint through Axios and React Query.

## Backend Setup

```powershell
cd D:\Project\ebook_ecommerce_website\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`, then update the PostgreSQL credentials:

```env
SECRET_KEY=django-insecure-change-this-key
DEBUG=True

DB_NAME=ebook_ecommerce_db
DB_USER=ebook_user
DB_PASSWORD=change_me
DB_HOST=localhost
DB_PORT=5432
```

Run migrations:

```powershell
python manage.py migrate
```

Seed base data:

```powershell
python manage.py seed_base
```

Create an admin user if needed:

```powershell
python manage.py createsuperuser
```

Run the backend server:

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

Run the frontend server:

```powershell
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Verification

Backend:

```powershell
cd D:\Project\ebook_ecommerce_website\backend
.\.venv\Scripts\Activate.ps1
python manage.py check
python manage.py makemigrations --check --dry-run
```

Frontend:

```powershell
cd D:\Project\ebook_ecommerce_website\frontend
npm run lint
npm run build
```

## Development Notes

- Keep real `.env` files out of Git.
- Local uploaded files will be stored in `backend/media/`.
- `PaymentMethod.cvv` is only suitable for local mock development. Do not store CVV data in production; use payment-provider tokens instead.
- The next major step is building DRF serializers, viewsets, and routes for the catalog API.
