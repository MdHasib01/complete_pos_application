# POS Application — Supabase → Go + Postgres Migration

Tracking document for replacing Supabase with a Go (Gorilla/mux) + PostgreSQL backend.
Auth is **token-based (JWT)** on both sides, with **roles & permissions** enforced on the
backend and reflected in the frontend UI.

Legend: ✅ done · 🚧 in progress · ⬜ todo

---

## 1. Frontend audit — routes & data access (recorded)

### React Router routes
| Path | Page | Access |
|------|------|--------|
| `/login` | LoginPage | public |
| `/` | DashboardPage | private |
| `/products`, `/products/:id` | ProductsPage | private |
| `/categories` | CategoriesPage | private |
| `/pos` | POSPage | private |
| `/sales` | SalesPage | private |

### Supabase calls → new REST endpoints
| Where | Old Supabase call | New endpoint |
|-------|-------------------|--------------|
| AuthContext | `auth.signInWithPassword` | `POST /pos/login` |
| AuthContext | `auth.signUp` | `POST /pos/register` |
| AuthContext | `auth.signOut` | `PUT /pos/logout` |
| AuthContext | `auth.getSession` | `GET /pos/me` |
| CategoriesPage | `from('categories').select/insert/update/delete` | `GET/POST/PUT/DELETE /categories` |
| ProductsPage / POSPage | `from('products').select('*,categories(*)')`, by id, insert/update/delete, `gt('stock',0)` | `GET/POST/PUT/DELETE /products`, `GET /products?in_stock=true` |
| POSPage | insert `sales` + `sale_items` + stock update | `POST /sales` (single transaction) |
| SalesPage | `from('sales').select` by date, `from('sale_items').select('*,products(*)')` | `GET /sales?date=YYYY-MM-DD`, `GET /sales/{id}` |
| DashboardPage | today sales + product/category counts | `GET /dashboard/stats` |

---

## 2. Backend (Go + Postgres)

Reuses the existing `go-rest-starter` scaffold (JWT sessions, role/permission tables).

| Item | Status |
|------|--------|
| Migration `000002_pos.up.sql` (categories, products, sales, sale_items, permissions + role_permission seed, `CASHIER` role) | ✅ |
| `model/pos.go` — Category, Product, Sale, SaleItem, auth DTOs | ✅ |
| `dao/pos.go` — queries (login lookup, CRUD, sales tx, dashboard) | ✅ |
| `controller/pos.go` — login/register/me/logout + domain logic | ✅ |
| `rest/pos.go` — HTTP handlers + POS permission constants | ✅ |
| Routes registered in `rest/route.go` | ✅ |
| `config.json` DB set to `pos_db` | ✅ (pre-existing) |

### Auth & permissions model
- **Login** (`POST /pos/login`) accepts email **or** username + password, returns
  `{ token, user, role, permissions }`. Token is a signed JWT; a session row is created.
- **Register** (`POST /pos/register`) creates an auto-verified `CASHIER` user and logs them in.
- **`GET /pos/me`** validates the bearer token and returns current user + role + permissions.
- Every domain route is guarded by a permission id; `SUPERADMIN` bypasses all checks.

| Permission | Id | ADMIN | MANAGER | CASHIER |
|------------|----|:-----:|:-------:|:-------:|
| View products | 20 | ✔ | ✔ | ✔ |
| Manage products | 21 | ✔ | ✔ | – |
| View categories | 22 | ✔ | ✔ | ✔ |
| Manage categories | 23 | ✔ | ✔ | – |
| Create sale | 24 | ✔ | ✔ | ✔ |
| View sales | 25 | ✔ | ✔ | ✔ |
| View dashboard | 26 | ✔ | ✔ | ✔ |

Roles: `SUPERADMIN(1)`, `ADMIN(2)`, `MANAGER(3)`, `USERROLE(4)`, `CASHIER(5)`.

Seeded test logins (password `Admin@1234`): `superadmin@example.com`, `admin@example.com`.

---

## 3. Frontend integration

| Item | Status |
|------|--------|
| `src/lib/api.ts` — fetch wrapper (bearer token, `{result,error}` envelope) | ✅ |
| `src/context/AuthContext.tsx` — JWT auth, `hasPermission()` | ✅ |
| `src/types/index.ts` — User/Role/Permission + entity types | ✅ |
| Remove `@supabase/supabase-js` + `src/lib/supabase.ts` | ✅ |
| CategoriesPage → REST | ✅ |
| ProductsPage → REST | ✅ |
| POSPage → REST | ✅ |
| SalesPage → REST | ✅ |
| DashboardPage → REST | ✅ |
| Layout — permission-gated nav/actions | ✅ |
| `.env` → `VITE_API_URL` | ✅ |

---

## 4. Running locally

**Backend**
```
cd backend
# ensure Postgres running with a database named pos_db (see config.json)
go run .          # serves on :8080, runs migrations on boot
```

**Frontend**
```
cd frontend
npm install       # supabase dep removed
npm run dev       # Vite dev server; talks to VITE_API_URL (default http://localhost:8080)
```

---

## 5. Verification (done end-to-end against a live Postgres)

Confirmed working via the running server on `:8080`:
- `POST /pos/login` (admin & superadmin) → token + user + role + permissions.
- Admin: `GET /categories`, `POST /products` (returns category join), `POST /sales`
  (stock 40 → 38 after selling 2), `GET /dashboard/stats` aggregates.
- `POST /pos/register` → new **CASHIER** with 5 permissions.
- Permission enforcement: cashier `POST /products` → **403**, `GET /products` → **200**,
  `POST /sales` → **200**. No token → **403**. Wrong password → invalid-credentials error.
- Frontend `tsc` + `vite build` pass; backend `go build ./...` passes.

### Starter bugs fixed along the way
The reused scaffold had a broken session layer that blocked every authorized route:
- `dao/migrations/000003_fix_sessions.up.sql` — renamed `sessions.expire_at`/`last_used`
  to `expireat`/`lastused` to match `dao.UpdateSession`'s query.
- `dao/authentication.go` `CreateSession` — now sets `expireat`/`lastused`/`is_valid` on
  insert (previously `expireat` was `NULL`, so sessions read as already-expired).

## 6. Cloudinary product images

Product images are stored in Cloudinary; the DB keeps the `image_public_id` so the
asset can be removed when the product (or its image) is deleted. All Cloudinary calls
are **server-side** (the API secret never reaches the browser).

| Item | Status |
|------|--------|
| Migration `000004_product_image.up.sql` — `products.image_public_id` | ✅ |
| Config keys `cloudinaryCloudName/APIKey/APISecret` (config.json + config.go) | ✅ |
| `pkg/cloudinary/cloudinary.go` — signed upload + destroy (stdlib, no SDK) | ✅ |
| `POST /uploads/image` (ManageProducts) → `{ public_id, url }` | ✅ |
| `DELETE /uploads/image` (ManageProducts) — destroy by public_id | ✅ |
| Product create/update/delete carry `image_public_id` | ✅ |
| Backend deletes old image on product update (image replaced) and on product delete | ✅ |
| Frontend product form: upload on file-select, preview, remove | ✅ |

### Image lifecycle (exactly as requested)
1. Selecting a file uploads it to Cloudinary immediately (via the backend) and shows a preview.
2. **Cancel** the form, or a **save failure** (DB error / validation) → the just-uploaded,
   not-yet-persisted image is deleted from Cloudinary (frontend, tracks `pendingPublicId`).
3. **Delete product** → backend deletes the row then destroys the Cloudinary image.
4. Replacing the image on an existing product → backend destroys the previous asset after update.

Verified live against the given Cloudinary account: upload returns a real `public_id`;
deleting the product removed the asset (Cloudinary Admin API returns 404 for it).

## 7. POS "sell" bug fix (checkout was unclickable)

Symptom: clicking checkout/complete on `/pos` did nothing and **no `POST /sales` ever
reached the backend**. Root cause was a **layout** bug, not the API: the products grid
(`h-[calc(100vh-8rem)]` + `flex-1 overflow-y-auto` without a proper height/`min-h-0`
chain) overflowed and rendered on top of the cart's Checkout/Complete buttons, so the
grid intercepted the clicks. Replaced with a natural-flow layout (`items-start`, sticky
cart column). Reproduced and confirmed fixed with a headless-browser run (checkout →
complete → `POST /sales` 200). Also added visible checkout error handling and an
auth-expiry redirect to `/login`.

## 8. Notes / follow-ups
- JWT signing key is currently the scaffold's hardcoded `internal_key`; move to config/env for production.
- Sessions expire after 1h and are refreshed on each authorized request.
- `sales.user_id` is the integer user id from the JWT session (server-assigned, never trusted from client).
</content>
</invoke>
