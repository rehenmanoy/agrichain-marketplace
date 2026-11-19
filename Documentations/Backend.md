# AgriChain: Backend

Express 5 REST API on Node 22 with PostgreSQL. Folder: `backendft`. Back to the [main document](AgriChain-Main.md). Tables are in [Database.md](Database.md).

## 1. Stack

Node.js (≥ 20) · Express 5 · PostgreSQL via `pg` (plain SQL, no ORM) · zod 4 validation · JWT (`jsonwebtoken`) · `bcryptjs` · Helmet · CORS · `express-rate-limit` · morgan · `node-cron` · axios + cheerio (price scraper) · Vitest + Supertest · ESLint + Prettier.

## 2. Structure

```
src/
  app.js / server.js        Express app (importable by tests) / HTTP server
  routes.js                 Mounts every module under /api
  config/env.js             Validated environment variables
  db/                       pool.js, transaction.js (withTransaction), migrator.js, seed.js, migrations/
  jobs/dailyPrices.js       Daily market price job
  middleware/               auth.js (JWT + role guard), validate.js (zod), errorHandler.js
  modules/<feature>/        <feature>.routes.js -> .controller.js -> .service.js (+ .schemas.js)
    auth, regions, produce, listings, cart, orders, deliveries, reviews, dashboard, warehouses, bookings
  utils/                    AppError.js, constants.js, schemas.js
scripts/                    migrate.js, seed.js, reset.js, fetch-prices.js
tests/                      auth, marketplace, features, prices-job, scraper
docs/api.http               Runnable example requests
```

**Layering rule:** routes declare path, guards and validation; controllers translate HTTP; services hold business rules and SQL. Services that touch several rows use `withTransaction`.

## 3. Environment (`.env`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (5000) |
| `DATABASE_URL`, `TEST_DATABASE_URL` | Development and test databases |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing and lifetime (1h) |
| `SESSION_MAX_HOURS` | Longest a login can be renewed (12) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins (`http://localhost:5173`) |
| `PRICE_FETCH_TIME`, `PRICE_FETCH_TIMEZONE`, `PRICE_FETCH_ENABLED` | Daily price job (06:00, Asia/Kolkata, true) |

## 4. Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `npm start` | API with / without auto-reload |
| `npm run db:migrate` / `db:seed` / `db:reset -- --yes` | See [Database.md](Database.md#1-overview) |
| `npm run prices:fetch` | Fetch today's market prices now |
| `npm test` | Vitest against `TEST_DATABASE_URL` |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## 5. Authentication and roles

- Register and login use **phone + password**. Passwords are bcrypt hashes. Success returns `{ token, user }`.
- Send `Authorization: Bearer <token>`. `requireAuth` reads the token; `requireRole(...)` restricts a route.
- Roles: `FARMER`, `BUYER`, `WAREHOUSE_OWNER`, `DELIVERY_PARTNER`. The role is chosen at registration.
- `/api/auth/register` and `/login` are rate limited.
- **Token lifetime: 1 hour** (`JWT_EXPIRES_IN=1h`; it was 7 days until 2026-10-30). The token is **stateless**: restarting the server does not log anyone out, and a token stays valid until it expires.
- **Renewal:** `POST /api/auth/refresh` (any signed-in user) swaps a still-valid token for a fresh 1-hour one and returns `{ token, user }`. It re-reads the user from the database, so a deleted account is refused (401). Every token carries `auth_time` (the real login time) and refreshed tokens copy it forward, so **one login can never be extended past `SESSION_MAX_HOURS` (12)**; after that refresh returns 401 and the user must log in again. Tokens from before `auth_time` existed count from when they were issued.
- Idle log off is done by the frontend (see Frontend.md); the backend only enforces expiry and the 12-hour cap.
- **Password change:** `users.password_changed_at` is set whenever a password changes (own change or reset). `refreshSession` refuses any token whose `auth_time` is older than it, so older logins can no longer be renewed (they simply expire within the hour). `change-password` returns a fresh `{ token, user }` dated `ceil(password_changed_at)` so it is never older than the change.
- **Forgot password (one-time code):** `POST /api/auth/forgot-password { phone }` creates a 6-digit code (valid 10 minutes, stored hashed in `password_resets`, a newer code replaces an older one) and sends it through `utils/sms.js` `sendResetCode` (today it prints to the server console; a real SMS provider replaces that one function). The answer is the same whether or not the phone has an account. `POST /api/auth/reset-password { phone, code, new_password }` accepts the code once; **5 wrong tries cancel it** (the count is saved even though the request fails). With `RESET_CODE_IN_RESPONSE=true` (default outside production, on in tests) the forgot-password answer also contains `dev_code` so the flow can be tried without SMS. Forgot-password is rate limited to 5 per 15 minutes.
- Errors always look like `{ "error": { "message": "...", "details": [...] } }`. The frontend relies on this shape to tell an API error from a connection failure.

## 6. Endpoints

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an account |
| POST | `/api/auth/login` | public | `{ phone, password }` |
| GET | `/api/auth/me` | any | Current user |
| POST | `/api/auth/refresh` | any | Fresh 1-hour token for the same login (capped at 12 hours since login); returns `{ token, user }` |
| PATCH | `/api/auth/me` | any | `{ name?, base_location? }`; phone and area cannot be changed |
| POST | `/api/auth/change-password` | any | `{ current_password, new_password }`; returns a fresh `{ token, user }` |
| POST | `/api/auth/forgot-password` | public | `{ phone }`; same answer for unknown phones; `dev_code` only when `RESET_CODE_IN_RESPONSE` is on |
| POST | `/api/auth/reset-password` | public | `{ phone, code, new_password }`; single use, 5 tries |
| GET | `/api/notifications?limit=` | any | My notifications, newest first, with `unread_count` |
| PATCH | `/api/notifications/:id/read` | any (owner) | Mark one read |
| POST | `/api/notifications/read-all` | any | Mark all mine read |
| GET | `/api/regions` | public | All regions |
| GET | `/api/produce?category=` | public | Catalogue |
| GET | `/api/produce/prices` | public | Today's and yesterday's price for every item |
| GET | `/api/produce/:id/price` | public | Today's market price |
| POST | `/api/produce` | farmer | `{ name, category }`: add a **custom** produce type (no market price, max 10 per farmer, duplicate name 409) |
| GET | `/api/listings?region_id=&category=&produce_id=&search=` | public | Browse active listings |
| GET | `/api/listings/:id` | public | One listing |
| GET | `/api/listings/mine` | farmer | My listings |
| POST | `/api/listings` | farmer | `{ produce_id, available_qty, listing_price? }` |
| PATCH | `/api/listings/:id` | farmer (owner) | `{ available_qty?, listing_price?, is_active? }` |
| PATCH | `/api/listings/:id/deactivate` | farmer (owner) | Stop selling |
| DELETE | `/api/listings/:id` | farmer (owner) | Soft delete; refused while it has open orders |
| GET | `/api/cart` | buyer | Cart grouped by farmer: live price, stock, per-farmer subtotal and delivery fee, `problem` flag (`UNAVAILABLE`, `OTHER_REGION`, `NOT_ENOUGH_STOCK`), `grand_total` |
| POST | `/api/cart` | buyer | `{ listing_id, quantity }`; same listing again adds up |
| PATCH | `/api/cart/items/:id` | buyer | `{ quantity }` |
| DELETE | `/api/cart/items/:id`, `/api/cart` | buyer | Remove one item / empty the cart |
| POST | `/api/cart/checkout` | buyer | `{ delivery_address? }`; one order per farmer; returns the orders |
| POST | `/api/orders` | buyer | `{ items: [{ listing_id, quantity }], delivery_address? }`; returns an **array** of orders |
| GET | `/api/orders/mine?status=` | buyer | My orders |
| GET | `/api/orders/incoming?status=` | farmer | Orders on my listings |
| PATCH | `/api/orders/:id/cancel` | buyer / farmer | Cancel or reject while PENDING |
| PATCH | `/api/orders/:id/confirm` | farmer (owner) | PENDING → CONFIRMED |
| POST | `/api/orders/:id/review` | buyer (owner) | `{ rating 1-5, comment? }`, once, after delivery |
| GET | `/api/deliveries/available` | partner | Confirmed, unclaimed orders in my region |
| GET | `/api/deliveries/mine?status=` | partner | My deliveries |
| PATCH | `/api/deliveries/:orderId/accept` | partner | CONFIRMED → OUT_FOR_DELIVERY |
| PATCH | `/api/deliveries/:orderId/complete` | assigned partner | → DELIVERED |
| PATCH | `/api/deliveries/:orderId/delay` | assigned partner | `{ reason, minutes }` |
| PATCH | `/api/deliveries/:orderId/release` | assigned partner | Give back: → CONFIRMED |
| GET | `/api/reviews?farmer_id=` | public | A farmer's reviews |
| GET | `/api/reviews/partners?partner_id=`, `/warehouses?warehouse_id=` | public | A delivery partner's / warehouse's reviews (first names only) |
| POST | `/api/orders/:id/partner-review` | buyer (owner) | `{ rating 1-5, comment? }`; delivered order with a partner, once |
| POST | `/api/warehouse-bookings/:id/review` | farmer (owner) | `{ rating 1-5, comment? }`; booking taken out, once |
| GET | `/api/dashboard` | any | Stats for the user's role |
| GET | `/api/warehouses?region_id=&cold_storage=` | public | Cheapest first; each has `photos`, free space today and `open_bookings` |
| GET | `/api/warehouses/:id`, `/mine` | public / owner | |
| GET | `/api/warehouses/:id/availability?from=&to=` | any | `free_kg` on the busiest day of the range |
| POST | `/api/warehouses` | owner | `multipart/form-data`: fields plus **2 to 5 photos**; created in the owner's region |
| PATCH | `/api/warehouses/:id` | owner | Name, place, space (never below the booked peak), price, cold flag, `is_active` |
| DELETE | `/api/warehouses/:id` | owner | Soft delete; refused with open bookings |
| POST / DELETE | `/api/warehouses/:id/photos`, `/photos/:photoId` | owner | Add (max 5 total) / remove (min 2 stay) |
| POST | `/api/warehouse-bookings` | farmer | `{ warehouse_id, quantity_kg, produce_id?, start_date?, end_date? }`; creates a `REQUESTED` booking |
| GET | `/api/warehouse-bookings/mine`, `/incoming` | farmer / owner | |
| PATCH | `/api/warehouse-bookings/:id/approve`, `/reject` | owner | Answer a request (`reject` takes `{ note? }`) |
| PATCH | `/api/warehouse-bookings/:id/cancel` | farmer | A request, or an approved booking not started |
| PATCH | `/api/warehouse-bookings/:id/release` | farmer | Take produce out |
| POST | `/api/warehouse-bookings/:id/extend` | farmer | `{ new_end_date }` |
| PATCH | `/api/warehouse-bookings/:id/extension/approve`, `/reject` | owner | Answer an extension |
| PATCH | `/api/warehouse-bookings/:id/extension/cancel` | farmer | Withdraw an extension request |
| GET | `/uploads/warehouses/<file>` | public | A photo (static files) |
| GET | `/health` | public | API and database status |

## 7. Business rules

**Pricing.** A farmer's price must be within **±20%** of today's market price (`PRICE_BAND = 0.2`). If none is given the market price is used. The market price at listing time is stored with the listing so buyers can see how far a listing is from market.

**Cart and ordering.**
- Buyers keep a cart in the database (`cart_items`). Prices and stock are read live, so the cart always shows today's price. Adding checks region, availability and stock (counting what is already in the cart).
- Checkout (`placeOrders` in `orders.service.js`, shared with `POST /api/orders`) locks every listing in id order, checks each item, then creates **one order per farmer** with all that farmer's items in `order_items`. It is all or nothing: if any item fails, nothing is ordered and the cart is kept; the message names the item (for example "Not enough Cabbage. Available: 2").
- **Delivery fee = ₹20 + ₹2 × total kg of the order, once per order**, so two items from one farmer cost less delivery than two separate orders.
- Orders are per farmer because a delivery partner collects from one farmer. A farmer accepts or rejects the whole order; status, delay, give-back and review all stay per order.
- Order lists return `items` (array of `listing_id, produce_id, produce_name, produce_category, quantity, unit_price, line_total`) and `total_kg`. There is no single `produce_name` or `quantity` on an order any more.
- `CANCELLED` is only possible while `PENDING` and returns the stock of **every** item.

**Delivery flow.**
1. Farmer confirms → the order appears in `/deliveries/available` for partners **in the same region**.
2. First partner to accept wins (order row lock). Others get a 409, "This order has already been picked up".
3. The assigned partner can `delay` (reason `TRAFFIC`, `VEHICLE`, `WEATHER`, `WAITING_AT_FARM`, `OTHER`; 5 to 240 minutes; a new report replaces the old one) any number of times while out for delivery.
4. The assigned partner can `release`: status back to `CONFIRMED`; partner, pickup time and delay fields are cleared; it returns to the pool for everyone.
5. `complete` sets `DELIVERED` and `delivered_at`; the buyer can now review.
6. Only the assigned partner may delay, release or complete (else 403), and only while `OUT_FOR_DELIVERY` (else 400).
7. Buyers and farmers see `delay_reason`, `delay_minutes`, `delayed_at` in their order lists (`ORDER_SELECT`).

**Reviews.** One per delivered order (an order can hold several products); the buyer rates the farmer 1 to 5; listings show the farmer's average. A review's `produce_name` lists all products, for example "Carrot, Cabbage".

**Dashboards.** One endpoint returns stats by role:
- Farmer: earnings, 7-day revenue, top produce.
- Buyer: spending and orders.
- Partner: `total_earned`, `completed_deliveries`, `active_deliveries`, `available_now`, `earned_today`, `earnings_last_7_days` (zero-filled `[{date, earned}]`).
- Warehouse owner: occupancy.

**Warehouses and bookings** (rewritten 2026-10-30 after the user's decisions):
- **Pricing** stays per kg per day. A booking stores the price at request time (`rate_per_kg_per_day`); days are counted **inclusive** (1 Nov to 15 Nov = 15 days), so the amount is days × kg × rate.
- **Request flow:** the farmer sends a request for a date range, which is `REQUESTED` and **holds the space**. The owner of that warehouse accepts (`ACTIVE`) or declines (`REJECTED`, optional reason). The farmer can cancel a waiting request, or an approved booking that has not started (no charge).
- **Space is per day:** a request fits when the busiest day of its range still has room (`peakUsage` in `warehouses/capacity.js`, run under the warehouse row lock). Bookings on different dates share a warehouse. `available_capacity_kg` in the API now means "free today".
- **Release:** the farmer takes the produce out; the booking ends today and the amount becomes days used × kg × rate (early release pays less; overdue days are paid).
- **Overdue:** an `ACTIVE` booking whose end date has passed. Not stored: the API returns `is_overdue`, `overdue_days` and a live `amount_to_pay`. It keeps holding space and the charge keeps counting until the farmer releases or an extension is approved.
- **Extension:** the farmer asks for a later end date (capacity is checked for the extra days; the waiting extension holds them); the owner approves (end date and amount updated) or rejects; the farmer can withdraw. One waiting extension per booking. A waiting extension is closed when the booking is released or cancelled.
- **Warehouse changes:** space can't go below the booked peak over the next two years; the price only affects new requests; **pausing or removing is refused while any `REQUESTED` or `ACTIVE` booking exists** (409). Removal is a soft delete.
- **Photos:** 2 to 5 required at creation, never fewer than 2 afterwards. Upload is `multipart/form-data` handled by multer (memory storage, 5 MB each); each file's first bytes must be JPEG, PNG or WebP (SVG refused, the claimed type is not trusted); files get random names in `UPLOAD_DIR/warehouses` (default `backendft/uploads`, in `.gitignore`) and are served from `/uploads` with a long cache and `Cross-Origin-Resource-Policy: cross-origin`. If saving to the database fails the new files are deleted. Tests use a temporary folder.
- **Owner dashboard:** space in use today (waiting requests count), `active_bookings`, `pending_requests`, `pending_extensions`, `overdue_bookings`, and income from approved and finished bookings.

**Reviews (extended 2026-10-30).** Three kinds, all 1 to 5 stars with an optional comment, read-only once written, shown with the reviewer's first name only: the buyer rates the **farmer** (one per delivered order), the buyer rates the **delivery partner** (one per delivered order that had a partner, `partner_reviews`), and the farmer rates a **warehouse** (one per booking taken out, `warehouse_reviews`). Second review of the same order or booking is a 409. Aggregates (`rating`, `review_count`) appear on warehouse lists, the partner dashboard and the owner dashboard (plus `recent_reviews`); orders carry `is_partner_reviewed` and `partner_review_rating`, bookings `is_reviewed` and `review_rating`.

**Custom produce.** A farmer can add a produce type that is not in the catalogue (`produce.is_custom`, `created_by`). It has **no market price**: `getProducePrice` answers `{ is_custom: true, price: null }`, listings of it skip the ±20% band (`market_price` NULL, `price_source` FARMER, `listing_price` required) and it is left out of `listMarketPrices` and the daily price job. Each farmer may add at most 10 (`MAX_CUSTOM_PRODUCE_PER_FARMER`). Buyers see "Price set by the farmer"; listings expose `produce_is_custom`.

**Notifications.** `notify(db, userIds, type, data)` in `modules/notifications` is called **inside the same transaction as the event**, so a rolled-back action leaves no notice. A row stores a `type` and JSON `data`, not text; the frontend writes the sentence in the reader's language. Events: new order (farmer); order accepted, cancelled or rejected, picked up, delayed, delivered (buyer); confirmed and waiting, or given back (delivery partners **in that region only**); delivered and new reviews (farmer, partner, owner as relevant); booking requested, cancelled, released, extension requested (owner); booking approved or rejected (with the note), extension approved or rejected (farmer); new warehouse review (owner).

## 8. Daily market prices

- `modules/produce/marketPrice.scraper.js` reads Kerala prices from vegetablemarketprice.com; `marketPrice.service.js` upserts into `price_history`.
- `jobs/dailyPrices.js` runs at `PRICE_FETCH_TIME` (default 06:00 IST) and also **catches up on start-up** if today's prices are missing.
- If the site is down, the last known price is used.
- Produce names must match the site's names (migration 004 fixed `Onion Big` and `French Beans`).

## 9. Tests

118 tests in 10 files, run against a real PostgreSQL test database that is wiped each run:

| File | Tests | Covers |
|---|---|---|
| `auth.test.js` | 12 | Register, login, tokens, roles; token refresh (new token, keeps login time, expired, 12-hour cap, deleted account) |
| `marketplace.test.js` | 13 | Listings, price band, orders, overselling, cancel |
| `features.test.js` | 24 | Deliveries, delay, release, reviews, dashboards, warehouses, bookings |
| `cart.test.js` | 14 | Cart add, merge, stock, region, privacy, problem flags; checkout split per farmer, one fee, all-or-nothing, concurrent checkouts, cancel restores all items, delete-listing block, multi-item delivery and review |
| `warehouses.test.js` | 23 | Photos (min 2, max 5, fake image, size, add, remove, file deleted); change, pause and remove rules; request → approve / decline / cancel; inclusive days and price snapshot; per-day capacity; release charging days used; overdue (holds space, keeps charging); extensions (approve, reject, withdraw, capacity, overdue); permissions; owner dashboard |
| `account.test.js` | 10 | Profile edit; change password (wrong current, same password, old login stops renewing); forgot and reset (code, 5-try lock, expiry, single use, unknown phone, newer code replaces older) |
| `reviews-produce.test.js` | 8 | Partner and warehouse reviews (who, when, once, aggregates); custom produce (create, duplicate, limit 10, no band, off the price board) |
| `notifications.test.js` | 8 | Notice per event, only the right users, other region's partners excluded, list, mark read, read-all, privacy |
| `prices-job.test.js` | 3 | Daily job and catch-up |
| `scraper.test.js` | 3 | Price page parsing |

Last result (2026-10-30): 118 passing, lint clean.

## 10. Backend change log

| Date | Change |
|---|---|
| 2026-10-28 | Restructured into modules; phone + password JWT auth; migrations; tests |
| 2026-10-28 | ±20% price band, delivery partner role and flow, reviews, role-aware dashboard |
| 2026-10-28 | Daily price job, 80-item catalogue, scraper |
| 2026-10-28 | Listing soft delete and stop-selling |
| 2026-10-29 | Delay and release endpoints; delay fields on order lists; partner dashboard `earned_today` and 7-day series; 8 new tests; README and `docs/api.http` updated |
| 2026-10-30 | Warehouse rewrite: owner approval of bookings, per-day capacity, release charging days used, overdue, extensions, photos (multer, `/uploads`), warehouse edit / pause / soft delete, `GET /warehouses/:id/availability`, owner dashboard fields; migration 008; `UPLOAD_DIR`; 23 new tests (92 total); README and `docs/api.http` updated |
| 2026-10-30 | Safer sessions: token lifetime 7 days → 1 hour; `auth_time` claim; `POST /api/auth/refresh` with a 12-hour cap (`SESSION_MAX_HOURS`); `req.user.authTime`; 5 new tests (70 total); `.env` and `.env.example` updated |
| 2026-10-30 | Shopping cart: new `cart` module; orders now hold several items (`order_items`) from one farmer; checkout splits per farmer; delivery fee per order; `POST /api/orders` takes `items` and returns an array; order lists return `items` and `total_kg`; dashboard, reviews, listing delete and cancel updated for items; migration 007; 14 new tests (65 total); README and `docs/api.http` updated |
| 2026-10-30 | Account basics, reviews, custom produce, notifications: profile edit, change password, forgot/reset password by one-time code (`utils/sms.js`, `RESET_CODE_IN_RESPONSE`), `password_changed_at` check on refresh; partner and warehouse reviews; farmer-added produce without market price; new `notifications` module with `notify` called inside the event transactions; migration 009; 26 new tests (118 total) |

## 11. Rules for backend work

1. New feature = a module with routes, controller, service, schemas; register it in `routes.js`.
2. Validate every input with zod; return errors in the standard shape.
3. Anything with a race ("first one wins", stock) uses `withTransaction` and `FOR UPDATE`.
4. Add tests for every new rule, including permission failures.
5. Update README, `docs/api.http`, this file and the main changelog with the change.
6. Run `npm test` and `npm run lint` before saying it is done.
