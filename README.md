# OpenDiningApp

An open-source, self-hosted table-ordering system for restaurants. Customers **scan a QR code at their table**, browse the menu, and place orders — no waiter needed, no app download required.

---

## How It Works

1. Restaurant owner adds tables in the admin panel → each table gets a unique QR code
2. Staff prints and places QR codes on tables
3. Customers scan the QR with any phone camera → opens the menu in the browser
4. Customer adds items to cart, fills in name & phone, and places order
5. Admin panel shows live orders → staff updates status (Confirmed → Preparing → Ready → Served)
6. Customer sees real-time status on their phone

---

## Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/api` | 3001 | Express REST API (PostgreSQL) |
| `apps/customer` | 5174 | Customer-facing menu + ordering PWA |
| `apps/admin` | 5173 | Restaurant management dashboard |

---

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 — `npm install -g pnpm`
- PostgreSQL ≥ 14

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-org/opendiningapp.git
cd opendiningapp
pnpm install
```

### 2. Set up the database

```bash
# Run once on Linux/WSL if your OS username role does not exist
# Replace "hp" with your OS username (find it with: whoami)
sudo -u postgres createuser -s hp
createdb opendiningapp
psql opendiningapp -f apps/api/src/db/schema.sql
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit .env and set DATABASE_URL and JWT_SECRET
```

`apps/api/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/opendiningapp
JWT_SECRET=your-long-random-secret-here
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
APP_BASE_URL=http://localhost:5174
```

### 4. Run all apps in dev mode

```bash
pnpm dev
```

Or run individually:

```bash
# API
cd apps/api && pnpm dev

# Admin dashboard
cd apps/admin && pnpm dev

# Customer menu app
cd apps/customer && pnpm dev
```

### 5. Register your restaurant

Open **http://localhost:5173/register** and create your restaurant account.

---

## Troubleshooting

### Module not found errors (Turbo, Vite, Rollup, cross-env)

If you see errors like:
- `Cannot find module .../node_modules/turbo/bin/turbo`
- `Cannot find module @rollup/rollup-linux-x64-gnu`
- `Cannot find module .../node_modules/vite/bin/vite.js`

Cause:
- Dependencies were installed in one environment (Windows or WSL) and run in the other.
- Native/optional dependencies and symlinks can break across environments.

Fix:
1. Pick one environment and use it consistently.
2. Delete `node_modules` in that environment.
3. Reinstall and run from the same environment.

Windows (PowerShell):
```powershell
Remove-Item node_modules -Recurse -Force
pnpm install
pnpm dev
```

WSL (Linux shell):
```bash
rm -rf node_modules
pnpm install
pnpm dev
```

Recommendation:
- If your repo is in `C:\...`, use PowerShell for both install and run.
- If you want WSL-first workflow, keep the repo inside Linux filesystem (for example `~/opensense-dining`) and run everything there.

---

## Core Features

### Admin Dashboard (`apps/admin`)
- Register / login with email + password
- Add menu categories and items (name, price, description, image URL, veg/non-veg)
- Toggle item availability on/off instantly
- Create tables and generate downloadable / printable QR codes per table
- Live orders view with status management (Pending → Confirmed → Preparing → Ready → Served)

### Customer Menu (`apps/customer`)
- Opens instantly from QR scan — no app, no login
- Shows full menu with veg/non-veg indicators
- Search dishes by name
- Veg-only filter
- Add to cart with quantity controls
- Checkout with name, phone, and optional notes
- Order status page with auto-refresh (pay at counter)

### API (`apps/api`)
- `POST /api/auth/register` — create restaurant + admin account
- `POST /api/auth/login` — get JWT token
- `GET /api/menu/:slug?table=<tableId>` — public menu endpoint
- `POST /api/orders` — place order (public)
- `GET /api/orders/:orderId` — check order status (public)
- `GET /api/admin/tables` — list tables (auth)
- `POST /api/admin/tables` — add table (auth)
- `GET /api/admin/tables/:id/qr` — generate QR (auth)
- `GET /api/admin/categories` — list categories (auth)
- `POST /api/admin/categories` — add category (auth)
- `GET /api/admin/items` — list menu items (auth)
- `POST /api/admin/items` — add item (auth)
- `PATCH /api/admin/items/:id` — update item (auth)
- `DELETE /api/admin/items/:id` — delete item (auth)
- `GET /api/admin/orders` — list orders (auth)
- `PATCH /api/admin/orders/:id/status` — update status (auth)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt |
| QR generation | `qrcode` npm package |
| Customer app | React 18, Vite, Tailwind CSS, Zustand |
| Admin app | React 18, Vite, Tailwind CSS, Zustand, Axios |
| Monorepo | pnpm workspaces + Turborepo |

---

## Contributing

Pull requests are welcome! Please open an issue first for major changes.

---

## License

MIT
