# Readify Frontend

React + Vite frontend for the Readify ebook ecommerce website.

## Setup

```powershell
cd D:\Project\ebook_ecommerce_website\frontend
npm install
```

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Run

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

The Django backend must also be running at `http://127.0.0.1:8000/`.

## Checks

```powershell
npm run lint
npm run build
```

## Main Areas

- Home and browse catalog
- Book detail and reviews
- Cart and checkout
- User profile, password change, library, wishlist, orders
- Reader page
- Staff/admin dashboard, invoice/order management, book management, review moderation
- Admin-only category, promotion/coupon, and user management

## Frontend Notes

- The browse page loads categories from the backend and sorts them alphabetically for filtering.
- Checkout supports coupon entry and manual VietQR bank-transfer information.
- Dark mode is supported through the shared preferences context.
- Required form validation should show Vietnamese messages and keep focus on the missing field.
