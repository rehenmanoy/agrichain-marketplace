# AgriChain: Project Summary for Resume

> Built from the project documentation (Main, Backend, Frontend, Database, Mobile, Business Plan) as of 9 November 2026. All numbers below come from those documents.

---

## 1. One-line summary

**AgriChain** is a full-stack regional farm-to-buyer marketplace where farmers sell daily produce directly to buyers at a fair, market-linked price, with delivery partners and cold/dry warehouse storage on the same platform. Built with React 19, Node.js/Express 5 and PostgreSQL, in English and Malayalam.

**Tagline:** *From Farm to Market, Without Barriers.*

---

## 2. Ready-to-use resume entries

### Short version (3 bullets)

**AgriChain: Farm-to-Buyer Marketplace** | React 19, Node.js, Express 5, PostgreSQL, TanStack Query, Tailwind CSS, JWT, Vitest
- Built a full-stack, four-role marketplace (farmer, buyer, delivery partner, warehouse owner) with 60+ REST endpoints, 17 PostgreSQL tables and a multi-farmer cart whose checkout splits into one order per farmer.
- Kept prices fair and the data safe under concurrent use: a ±20% band around a daily scraped market price (automated cron job), plus row-locked transactions that stop overselling and double-claimed deliveries.
- Secured the app with JWT sessions (1-hour tokens, 12-hour renewal cap, idle log-off), bcrypt, a hashed one-time reset code, rate limiting and zod validation, backed by 118 integration tests against a real PostgreSQL database.

### Detailed version (5–6 bullets)

**AgriChain: Regional Farm-to-Buyer Marketplace** | *Full-Stack Developer*
*React 19 · Vite · Tailwind CSS v4 · TanStack Query · Node.js 22 · Express 5 · PostgreSQL · JWT · zod · Vitest · Supertest*

- Rebuilt a college project into a production-style full-stack marketplace connecting **farmers, buyers, delivery partners and warehouse owners**, each with their own dashboard, pages and permissions.
- Designed a modular Express 5 REST API (**12 feature modules, 60+ endpoints**, routes → controller → service layering) on PostgreSQL with **raw SQL and 9 versioned migrations** (no ORM), covering 17 tables with CHECK, UNIQUE and partial-index constraints.
- Implemented a **fair-pricing engine**: a scheduled job (node-cron, 06:00 IST, with start-up catch-up) scrapes daily Kerala market prices for an 80-item catalogue, and farmer prices are held within **±20% of the market rate**.
- Built a **database-backed shopping cart** with all-or-nothing checkout that splits into one order per farmer, plus delivery and warehouse-booking workflows that use **transactions and `SELECT … FOR UPDATE` row locks** to prevent overselling, double-claimed deliveries and overbooked storage.
- Built a **warehouse booking system** with owner approval, per-day capacity, inclusive-day billing, overdue tracking, extension requests and validated photo uploads (multer, magic-byte file-type checks).
- Hardened auth with **JWT (1-hour tokens, refresh with a 12-hour cap, idle log-off with a warning)**, bcrypt, a hashed 6-digit reset code (single use, 5 tries), rate limiting, Helmet and CORS; wrote **118 integration tests** (Vitest + Supertest) against a real test database.
- Delivered a **bilingual (English / Malayalam)** laptop-first React UI with in-app notifications, ratings and reviews, role dashboards with charts, and graceful connection-error handling.

---

## 3. Project overview

| Item | Detail |
|---|---|
| **Type** | Full-stack web application (marketplace / supply chain) |
| **Origin** | College project by Rehen Manoy and two teammates, rebuilt step by step into a resume-grade product |
| **Problem** | Farmers lose income to middlemen who pay below the real market price; buyers have no direct, trusted access to fresh local produce |
| **Solution** | A regional platform where farmers sell directly at a market-linked fair price, local partners deliver, and farmers can book cold or dry storage |
| **Region** | Kerala, India (demo regions: Erumely and Kanjirapally) |
| **Languages** | English and Malayalam throughout the UI |
| **Status** | Web app complete (all four roles); mobile app designed; business model planned for an investor pitch |

---

## 4. Technology stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4 (custom design tokens), React Router 7, TanStack Query 5, axios, i18next / react-i18next, Phosphor Icons |
| **Backend** | Node.js 22, Express 5, zod 4 validation, jsonwebtoken, bcryptjs, Helmet, CORS, express-rate-limit, morgan, multer, node-cron |
| **Database** | PostgreSQL 18 with raw SQL through `pg` (no ORM), custom migration runner, idempotent seed script |
| **Data collection** | axios + cheerio web scraper for daily market prices |
| **Testing and quality** | Vitest, Supertest (118 integration tests on a real PostgreSQL test database), ESLint, Prettier |
| **Mobile (designed)** | React Native + Expo (design complete, build planned) |

---

## 5. User roles and features

### Farmer
- Lists produce from an **80-item catalogue** (vegetables and fruits) with search and category filters.
- Price is validated against **±20% of today's market price**; a visual "fair-price ruler" shows where the price sits.
- Can add **custom produce** not in the catalogue (no market price; the farmer sets the price; max 10 per farmer).
- Accepts or rejects whole orders, follows them through delivery, sees delay notices.
- Edits stock and price, stops and restarts selling, soft-deletes listings (order history kept).
- **Books warehouse storage** with date ranges, photo gallery, live cost, free-space check; releases, extends, or cancels bookings; rates warehouses.
- Dashboard: market price carousel, earnings, 7-day revenue chart, top produce, ratings and reviews page.

### Buyer
- Browses produce from farmers in their own region with search and vegetable/fruit filters.
- **Shopping cart** stored in the database with live prices and stock; problem flags (unavailable, other region, not enough stock) block checkout.
- **Checkout splits into one order per farmer**, each with one delivery fee (₹20 + ₹2 per kg).
- Tracks orders with a status progress line, cancels while pending, sees delivery delays.
- Rates the farmer and the delivery partner after delivery; reads farmer reviews before buying.

### Delivery partner
- Sees confirmed, unclaimed orders **in their region only**; first to accept wins (row lock; others get "already picked up").
- Marks delivered, reports delays (reason + minutes), or gives a delivery back to the pool.
- One-tap call links to farmer and buyer.
- Dashboard: earnings today and in total, 7-day earnings chart, completed and active deliveries, ratings.

### Warehouse owner
- Lists cold or dry storage with **2 to 5 required photos**, capacity and per-kg-per-day price (with a per-quintal monthly hint).
- Accepts or declines booking requests (with a reason) and extension requests.
- Pause or remove a warehouse (refused while bookings are open).
- Dashboard: space in use, active bookings, pending requests and extensions, overdue alerts, income, recent reviews.

### Every role
- One login page for all roles (role chosen at sign-up, login redirects by role).
- Edit profile, change password, forgot password with a one-time code.
- **In-app notification bell** (polled every 30 s), written in the reader's language.
- Full English / Malayalam switch.

---

## 6. Technical highlights (talking points for interviews)

### Backend architecture
- **Modular structure:** 12 feature modules (auth, regions, produce, listings, cart, orders, deliveries, reviews, dashboard, warehouses, bookings, notifications), each with routes → controller → service → schemas.
- **Strict layering:** routes declare path, guards and validation; controllers translate HTTP; services hold business rules and SQL.
- **Consistent error shape** (`{ error: { message, details } }`) that the frontend uses to tell an API error from a network failure.
- Role-based access control through `requireAuth` and `requireRole` middleware.

### Database design
- **17 tables**, 9 numbered SQL migrations run by a custom migrator that records applied files and runs each in its own transaction.
- Constraints enforced in the database as well as the API (CHECK, NOT NULL, UNIQUE, partial unique indexes such as "one pending extension per booking").
- **Soft deletes** for listings and warehouses so order and booking history stay intact.
- Indexes for each main query: browsing, "my orders", available deliveries, space checks, unread notifications.

### Concurrency and data integrity
- Every "first one wins" action runs in a transaction with `SELECT … FOR UPDATE`:
  - Checkout locks every listing **in id order** to prevent overselling and deadlocks between concurrent checkouts.
  - Order row lock stops two partners claiming the same delivery.
  - Warehouse row lock plus **per-day peak-usage calculation** stops two requests being promised the same space.
- Checkout is **all or nothing**: if any item fails, no order is created and the cart is kept, with a precise error ("Not enough Cabbage. Available: 2").
- Notifications are written **inside the same transaction** as the event, so a rolled-back action leaves no stray notice.

### Pricing and automation
- **Web scraper** (axios + cheerio) collects daily Kerala market prices; results are upserted into `price_history` (one price per item per day).
- **Scheduled job** (node-cron) runs at 06:00 IST and catches up on start-up if today's prices are missing; falls back to the last known price if the source is down.
- The market price at listing time is stored with each listing so buyers can see how far it is from market.

### Warehouse booking engine
- Request → owner approval flow with statuses REQUESTED, ACTIVE, REJECTED, CANCELLED, RELEASED.
- **Per-day capacity:** bookings on different dates share space; a request fits only if the busiest day of its range has room.
- **Inclusive-day billing** with the price snapshot taken at request time; early release charges only days used.
- **Overdue** is computed, not stored: the booking keeps holding space and the charge keeps counting.
- Extension requests with capacity checks and owner approval.
- Secure photo uploads: multer memory storage, 5 MB limit, **file-type checked from magic bytes** (JPEG/PNG/WebP only, SVG refused), random filenames, cleanup when a database write fails.

### Security and sessions
- Phone + password login with **bcrypt** hashing.
- **JWT access tokens valid for 1 hour**, renewed every 20 minutes while the user is active, with a **12-hour hard cap** per login (`auth_time` claim carried across refreshes).
- **Idle log-off after 60 minutes** with a 60-second "Still there?" warning; token kept in `sessionStorage`, not `localStorage`.
- Password change invalidates older sessions (`password_changed_at` checked on refresh).
- Forgot password: **6-digit code, hashed, 10-minute expiry, single use, 5-try lockout**, same response for unknown phones (no account enumeration).
- Rate limiting on register, login and forgot-password; Helmet security headers; CORS allow-list; zod validation on every input.

### Frontend engineering
- **TanStack Query** for server state: caching, polling (deliveries every 20 s, notifications every 30 s) and targeted cache invalidation.
- **Connection-aware error handling:** if a page can't load because the server is down, a dedicated page with **Try again** appears; failed actions show an inline message instead.
- **Custom design system** with Tailwind v4 tokens (forest/leaf/sage palette, Lora + Inter typography) and reusable components (cards, dialogs, skeleton loaders, rating summaries, photo gallery, space bars, 7-day charts).
- **Full internationalisation** (English / Malayalam) with plural forms and language-aware number, currency and date formatting.

### Testing
- **118 integration tests in 10 files** (Vitest + Supertest), run against a real PostgreSQL test database wiped on every run.
- Covers auth and token refresh, price band, cart and checkout (including concurrent checkouts), delivery race conditions, warehouse capacity and overdue rules, photo validation, password reset lockout, reviews, notifications and regional privacy, the scraper and the daily job.
- ESLint clean on both frontend and backend; every feature also checked by hand in the browser.

---

## 7. Key numbers

| Metric | Value |
|---|---|
| User roles | 4 (farmer, buyer, delivery partner, warehouse owner) |
| REST API endpoints | 60+ |
| Backend feature modules | 12 |
| Database tables | 17 |
| SQL migrations | 9 |
| Produce catalogue | 80 vegetables and fruits |
| Automated tests | 118 (10 test files) |
| Frontend routes | 20+ pages across 4 role areas |
| UI languages | 2 (English, Malayalam) |

---

## 8. Product and business work (beyond code)

Alongside the software, a business plan was written to prepare for an investor pitch:

- **Revenue model** with the rule that **farmers pay ₹0**: income from a small buyer fee, a warehouse booking commission and a share of each delivery fee; hotels and restaurants later.
- **Inclusion of farmers without smartphones:** one-time registration through Akshaya centres, local coordinators, a planned helper login where every change needs the farmer's OTP.
- **Farmer verification:** identity check plus proof of farming, coordinator farm visit, and approval by two admins.
- **Payments design:** online payment held until delivery and then split three ways (farmer, partner, platform), with refund and damage rules and a ₹1-per-order damage fund.
- **Pilot plan** for one region (10–20 farmers, 50–100 buyers), and a list of hard investor questions with prepared answers.

---

## 9. Mobile app (in progress)

- Chose **React Native + Expo** to reuse the web app's JavaScript, React hooks, TanStack Query and i18n code, after comparing it with Flutter.
- **Complete phone design** finished for all four roles in English and Malayalam: bottom-tab navigation, bottom sheets, 44 px touch targets, Anek Malayalam font, phone-specific session and offline rules.
- The build is planned day by day, starting with the buyer role; it reuses the existing backend unchanged.

---

## 10. Honest scope (what to know before an interview)

Be ready to say clearly what is and isn't done:

| Area | Status |
|---|---|
| Web app (all four roles), API, database, tests | **Done** |
| Deployment, Docker, README screenshots | Not started |
| Online payments | Designed, **not built** (earnings are the sum of delivery fees) |
| SMS | Not connected (reset codes print to the server console in development) |
| Mobile app | Designed; coding not started |
| Admin role and farmer verification | Designed in the business plan, not built |
| Malayalam text | Written, still needs a native-speaker review |

Tip: once it's deployed, add the live link and GitHub link to the resume entry. Recruiters click those first.

---

## 11. Suggested resume skills keywords

`React` · `Node.js` · `Express.js` · `PostgreSQL` · `SQL` · `REST API` · `JWT Authentication` · `TanStack Query` · `Tailwind CSS` · `Vite` · `Vitest` · `Supertest` · `Integration Testing` · `Database Design` · `Database Migrations` · `Transactions & Concurrency` · `Web Scraping (Cheerio)` · `Cron Jobs` · `File Uploads (Multer)` · `Role-Based Access Control` · `Internationalization (i18n)` · `Zod` · `React Native / Expo (learning)`
