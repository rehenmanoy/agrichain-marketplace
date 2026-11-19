# AgriChain: Main Document

The single place to see **what AgriChain is, what we built, how we work together, and what went wrong along the way**.

| Document | What it holds |
|---|---|
| **AgriChain-Main.md** (this file) | Overview, working agreements, decisions, changelog, mistakes and lessons, open items |
| **[Business-Plan.md](Business-Plan.md)** | **Business decisions and open questions** (who pays, farmers without smartphones, verification, delivery, payments, pilot). Open questions are at the top |
| **[Board-Questions.md](Board-Questions.md)** | **The hard questions a board or investor could ask, with their answers as we settle them** |
| [AgriChain-Resume-Summary.md](AgriChain-Resume-Summary.md) | Resume-ready summary of the whole project: bullets, stack, features, key numbers, honest scope |
| [Frontend.md](Frontend.md) | React app: routes, pages, components, design system, language, error handling |
| [Backend.md](Backend.md) | Express API: modules, endpoints, business rules, jobs, tests |
| [Database.md](Database.md) | PostgreSQL: tables, constraints, migrations, seed and test data |
| [Mobile.md](Mobile.md) | React Native + Expo app: day-by-day learning plan, decisions, progress log |
| [Mobile-Design.md](Mobile-Design.md) | One-page review of the whole phone design: all four roles, English and Malayalam |
| [Mobile-Design-Mockups.html](Mobile-Design-Mockups.html) | The phone screens as pictures (open in a browser), English and Malayalam |
| [Mobile-Design-Header-Options.html](Mobile-Design-Header-Options.html) | White vs dark striped top bar and tab bar, compared on the buyer screens. White chosen 2026-11-03 |

> **Business questions first:** the open business questions waiting for a decision are at the top of [Business-Plan.md](Business-Plan.md#1-open-questions-decide-next).

> **Rule for this folder:** every change to the project gets an entry in the [Changelog](#5-changelog) below *and* in the matching document (Frontend, Backend, Database or Mobile). Every time the user corrects something, it goes in [Mistakes and lessons](#6-mistakes-and-lessons). Read section 3 and section 6 before starting any new work.

---

## 1. What AgriChain is

**From Farm to Market, Without Barriers.** A regional marketplace where farmers sell daily produce directly to buyers and retailers at the day's market price, with no middlemen. It started as a college project (Rehen Manoy and two teammates) and is being rebuilt step by step into a resume-grade full-stack project.

Roles:

| Role | What they do | Pages built |
|---|---|---|
| Farmer | Lists produce at a fair price (market price ±20%), accepts orders, books warehouse space | Yes |
| Buyer | Browses farmers in their own region, orders, tracks delivery, rates the farmer | Yes |
| Delivery partner | Takes confirmed orders in their region, delivers, reports delays, earns the delivery fee | Yes |
| Warehouse owner | Lists cold or dry storage with photos, answers farmers' booking and extension requests | Yes (built 2026-10-30) |

### The order journey

The buyer adds produce to a **cart**; checkout makes **one order per farmer** (a partner collects from one farmer), each holding all of that farmer's items, with one delivery fee.

```
Buyer places order            PENDING
Farmer accepts                CONFIRMED          (farmer can also reject; buyer can cancel while PENDING)
Partner takes the delivery    OUT_FOR_DELIVERY   (partner may report a delay, or give it back -> CONFIRMED)
Partner marks delivered       DELIVERED          (buyer can now rate the farmer)
```

Delivery fee = ₹20 + ₹2 per kg of everything in the order, once per order, paid by the buyer at checkout and earned by the partner. There is no payment system: "earnings" are the sum of fees on delivered orders.

## 2. Project layout

```
C:\PROJECTS\FT_Project_Node\
  backendft\               Express 5 API + PostgreSQL migrations + tests
  frontendft\agrichain\    React 19 web app
  Documentations\          these documents
```

Local setup, ports and demo accounts:

| Item | Value |
|---|---|
| API | `http://localhost:5000` (`npm run dev` in `backendft`) |
| Web app | `http://localhost:5173` (`npm run dev` in `frontendft\agrichain`); Vite forwards `/api` to the API |
| Databases | `ft_db` (development), `ft_db_test` (tests; wiped on every run) |
| Demo password | `AgriChain@123` for every demo account |

| Role | Region | Phone |
|---|---|---|
| Farmer | Erumely | 9991110001 |
| Farmer | Kanjirapally | 9661439890 |
| Buyer | Erumely | 9791118801, 8891120981 |
| Buyer | Kanjirapally | 9456439760 |
| Warehouse owner | Erumely | 9771238800 |
| Delivery partner | Erumely | 9000011111 |
| Delivery partner | Kanjirapally | 9000022222 |

### How to run the project

Needs Node 22 and PostgreSQL 18 running, with the `ft_db` database and `backendft/.env` set up (copy `.env.example` and fill in `DATABASE_URL` and `JWT_SECRET`). Use **two terminals**.

| Step | Where | Command |
|---|---|---|
| 1. Install | `backendft` | `npm install` |
| 2. Build the tables | `backendft` | `npm run db:migrate` (safe to repeat; see [Database.md](Database.md#what-a-migration-is-plain-words)) |
| 3. Demo data, first time only | `backendft` | `npm run db:seed` |
| 4. Start the API | `backendft` | `npm run dev` (http://localhost:5000) |
| 5. Install | `frontendft\agrichain` | `npm install` |
| 6. Start the website | `frontendft\agrichain` | `npm run dev` (http://localhost:5173) |

Then open http://localhost:5173 and log in with a demo account above. Both programs must be running, because the website forwards `/api` and `/uploads` to the API.

Other commands:

| Command | Where | What it does |
|---|---|---|
| `npm test` | `backendft` | Runs the tests against `ft_db_test` (wiped each run, your dev data is safe) |
| `npm run lint` | both | Style and mistake checks |
| `npm run build` | `frontendft\agrichain` | Production build |
| `npm run prices:fetch` | `backendft` | Fetch today's market prices now |
| `npm run db:reset -- --yes` | `backendft` | **Drops every table** and starts over. Never use it on data you want to keep |

After pulling someone else's code: run `npm install` in both folders if `package.json` changed, then `npm run db:migrate`.

Forgot-password codes print in the API terminal, and show on the page too while `RESET_CODE_IN_RESPONSE` is on (default in development).

## 3. Working agreements (how Claude must work on this project)

These come straight from the user's instructions. They are not optional.

1. **No git, ever.** Do not run `git init`, `add`, `commit`, `push` or add remotes. The user owns the GitHub repo and does all repo actions. Write code and say what changed.
2. **Plan first for anything new.** The user wants to agree on the plan (pages, flow, choices) before code is written. Ask when a real choice exists, otherwise pick the obvious option and say so.
3. **Laptop-first.** Layouts are for a laptop screen with a **top navigation**. Not phone-first, not a sidebar.
4. **Standard-size buttons.** No big buttons.
5. **Stick to the chosen look.** The palette and typography come from the reference site the user picked (see [Frontend.md, Design system](Frontend.md#3-design-system)). Do not invent new directions. Show a mockup before introducing a new page style.
6. **Every label in two languages.** English and Malayalam, through i18n keys. The user reads Malayalam and corrects it. Treat all Malayalam written by Claude as *needs a native check* and say so.
7. **Wording preferences.** Buyer is written ബയർ / ബയർമാർ. No "Uh oh" on the 404 page.
8. **Never delete the user's data without asking.** Clean up test data you created, or list it in the summary and ask.
9. **Verify before saying done.** Run tests, lint and build, and check the flow in the browser. Say what was *not* checked.
10. **Document every change.** Update this folder as part of the work, not afterwards.
12. **The mobile app is a learning project.** Design and the phone plan come first (Mobile.md section 4), then build day by day. Claude writes the code and explains every step; the user follows the flow and checks it on the phones (decision 2026-10-31). Never build ahead of the day's plan or finish phases alone. Plan each day first, and document each day in [Mobile.md](Mobile.md) and here, exactly like the website.
11. **Dev servers:** start them through `.claude/launch.json` (`backend` on 5000, `frontend` on 5173). Never run a broad `taskkill node`.
13. **Business decisions go in [Business-Plan.md](Business-Plan.md) the same day** (user instruction 2026-11-03). Open questions stay in its section 1 until answered. Discuss business topics **one part at a time, short**, and wait for a decision before the next part. When payments are built, they follow Business-Plan.md section 7.

## 4. Roadmap and status

| Step | Status |
|---|---|
| 1. Backend restructure (modules, JWT phone + password auth, SQL migrations, tests) | Done 2026-10-28 |
| 2. Feature gaps (±20% price band, delivery partner role and flow, reviews, role dashboards) | Done 2026-10-28 |
| 3a. Farmer pages | Done |
| 3b. Landing page, single login and sign-up with role choice, 404 page | Done |
| 3c. Buyer pages | Done |
| 3d. Delivery partner pages and connection-error 404 | Done 2026-10-29 |
| 3d+. Shopping cart (several products per order) | Done 2026-10-30 |
| 3d++. Safer sessions (1-hour token, idle log off) | Done 2026-10-30 |
| 3e. Warehouse owner pages, with booking approval, extensions and photos | Done 2026-10-30 |
| 3f. Account basics (edit profile, change password, forgot password), reviews for farmers / partners / warehouses, farmer-added produce, in-app notifications | Done 2026-10-30 |
| 4. README screenshots, Docker, deployment | Not started |
| 5. Mobile app (React Native + Expo), learning project, built day by day with the user | Planned 2026-10-30, see [Mobile.md](Mobile.md) |

Decisions made along the way (do not re-open without a reason):
- Stay on JavaScript. Raw `pg` and SQL migrations, no ORM.
- Keep the warehouse feature.
- **Warehouse bookings need the owner's approval.** A farmer requests a date range (for example 1 to 15 Nov); the owner accepts or declines; when the dates end the farmer releases or extends, and the owner approves extensions. Past the end date a booking is **Overdue**: it keeps its space and the daily charge continues. (User decision 2026-10-30.)
- **A warehouse needs 2 to 5 photos.** Photos are stored on the server's disk. It can be paused or removed only while it has no waiting or approved bookings.
- Warehouse price stays **per kg per day** (the app shows the per-quintal monthly equivalent as a hint for owners). **Cold storage costs more than dry** (electricity). Reference rates from the user (2026-10-30): dry about ₹1,000 for 100 kg over 15 days (₹0.67/kg/day), cold ₹1,500 for the same (₹1/kg/day). The owner sets the price; the seed and demo warehouses use these.
- Advance-order dates and an "organic" flag were deliberately skipped.
- **No real SMS and no payment system for now** (user decision 2026-10-30: the project is not at deployable scale). The reset code is printed in the server console; earnings are the sum of delivery fees.
- **No "Buy now" shortcut.** Everything goes through the cart (user agreed 2026-10-30).
- One login page for every role; the account's role decides the landing page. The role is chosen at sign-up.
- Market prices are fetched automatically every day at 06:00 IST.
- A delivery partner can either give a delivery back or report a delay and still deliver.
- The connection-error 404 appears only when a *page* cannot load; failed *actions* show a red message.
- The cart is stored in the database. The shop's single **Order** button was replaced by **Add to cart**. Checkout makes one order per farmer; delivery fee is per order; a farmer accepts the whole order; checkout is all or nothing.

- **Phone and area cannot be edited** (the phone is the login; the area ties an account to its orders, listings and warehouses). Name and place can.
- **Forgot password uses a one-time code** (6 digits, 10 minutes, hashed, single use, 5 tries). No SMS service yet: the code is printed in the server console, and in development also shown on the page. Changing or resetting a password stops older logins from renewing.
- **Farmer-added produce has no market price**: no ±20% band, the farmer sets the price, buyers see "Price set by the farmer", max 10 per farmer, kept off the price board.
- **Reviews are read-only and show first names only.** One per order for the farmer, one per order for the delivery partner, one per finished booking for the warehouse.
- **Notifications are in-app only** (a bell, refreshed every 30 seconds), written in the reader's language from a type and data. No SMS or push.

## 5. Changelog

Newest first. Add a line for every change, with the area it touched.

### 2026-11-16: Mobile build started (Day 0 and Day 1)
- **Done:** checked Node 22, created `mobileft\agrichain-mobile`, created the Expo project (blank template, SDK 58), ran it with `npx expo start --lan`, edited `App.js` to "Hello AgriChain" and saw it update live on Android and iPhone. Details in [Mobile.md section 5](Mobile.md).
- **Note:** iPhone Expo Go needs a free Expo account, signed in on the phone and with `npx expo login` on the laptop. `create-expo-app` also created a git repository with one commit inside the project; the user decides what to do with it.
- **Next:** Day 2, core components and one static produce card.

### 2026-11-05: Board questions prepared
- **Why:** the user wants to be ready for hard questions when pitching, after being stuck in front of professors on an earlier project.
- **Done:** went through the documents, the code and some outside sources as a critic, and wrote [Board-Questions.md](Board-Questions.md), with the 10 hardest first. To be answered one group at a time.
- **Business-Plan.md:** pilot questions put on hold; order corrected so the pilot follows the pitch; the payment example now notes the gateway charge that was left out.
- **Correction:** I told the user the app already has a phone OTP. It doesn't: sign-up has no phone check, and only the forgot-password code exists, printed to the server console. **No code changed.**

### 2026-11-03: Business plan discussion (part 1)
- **Why:** before pitching to investors, the user and their team listed loopholes: how the product owner earns without being a middleman, farmers without phones, farmer verification, delivery.
- **Decided:** farmers pay ₹0; income from buyers' %, warehouse commission and a share of the delivery fee, then hotels, then government; Akshaya once plus coordinator visits and a helper login with farmer OTP; two-person farmer verification with the user's team as admin; local delivery partners with farm pickup; payments held until delivery and split three ways; damage rules with a ₹150 partner limit and a ₹1-per-order damage fund from AgriChain's share. Full detail in [Business-Plan.md](Business-Plan.md).
- **Open:** pilot area and rollout order, exact fees, and the other questions in Business-Plan.md section 1. **No code changed.** The app features these decisions need are listed in Business-Plan.md section 8.

### 2026-11-03: Mobile phone design agreed
- **Why:** the user wanted the whole phone interface designed before any code.
- **Decided (details in [Mobile.md section 4](Mobile.md#4-design-and-phone-plan-done-before-any-code)):** 4 bottom tabs (Home, Shop, Orders, Account) with Cart and Bell in the top bar; light only, same palette as the website with **only the page background green-tinted** (cards stay white); one number style everywhere (Inter 15 px semibold); less crowded cards; price strip with thin dividers that moves and stops on tap; Shop card keeps a labelled **Add to cart** button; session, back, keyboard and connection rules for the phone.
- **Mockups shown:** Log in, Home, Shop, Add-to-cart sheet, Cart, Orders, plus a navigation map. Not yet shown: Malayalam check, Deliver-to sheet, Sign up, Forgot password, Notifications, Rate sheet, Account.
- **Still no code.** Lessons added to Mobile.md (MD1 to MD3).
- **Design completed (same day):** all buyer screens mocked (see [Mobile.md 4.7](Mobile.md#47-remaining-screens-and-rules-done-2026-11-03)). User decisions: small **EN | ML** language toggle aligned with the logo; no header on Sign up; the delivery address typed at checkout is **remembered** for the next order.
- **Malayalam check (same day):** one font for the whole app, **Anek Malayalam**, headings bold (700), body 13 px, small 11 px; tab names ഹോം · കട · ഓർഡർ · അക്കൗണ്ട്; long order statuses go on their own line. New Malayalam lines are listed in [Mobile.md 4.6](Mobile.md#46-malayalam-in-the-app-checked-2026-11-03) for a native check.
- **Other roles designed (same day):** farmer (5 tabs: Home, Produce, Orders, Storage, Account; Reviews under Account), delivery partner (Home, Available, Deliveries, Account) and warehouse owner (Home, Warehouses, Bookings, Account) mocked in English; Sign up has the four role cards again. Details in [Mobile.md 4.8](Mobile.md#48-farmer-delivery-partner-and-warehouse-owner-designed-2026-11-03). After feedback: the farmer's "Stop selling" is two lines centred in an equal-width button row, and the partner's Home and Available buttons use the standard 44 px button. Lesson MD4 added. **Not checked:** Malayalam for these roles, partner stats and "Sell again" against the website, a real phone. Still no code.

### 2026-10-30: Mobile app planned
- **Why:** the website is finished; the user wants to learn mobile development by turning AgriChain into an app, with zero prior mobile knowledge.
- **Decided:** React Native + Expo (compared with Flutter: reuses the user's JavaScript and React knowledge, gentler learning curve), Buyer role first, backend reused unchanged, built day by day with the user rather than all at once.
- **Docs:** new [Mobile.md](Mobile.md) with the web-vs-mobile guide and a 5-week day-by-day plan; working agreement 12 added.
- **No code written yet.** 2026-10-31: the user has both Android and iPhone; Claude writes the code and explains it; **a phone design and a plan for how the app behaves on a phone are done first** (Mobile.md section 4, design days D1 to D4) before Day 1.

### 2026-10-30: Account basics, reviews everywhere, custom produce, notifications
- **Why:** the user asked for edit profile, change password, forgot password and a farmer reviews page, plus "anything we have left behind as functions". I listed the one-sided features and the user chose all four: buyers reading farmer reviews, farmers adding produce, rating delivery partners and warehouses, and notifications.
- **Database:** migration `009_accounts_reviews_notifications.sql` (`password_changed_at`, `password_resets`, `partner_reviews`, `warehouse_reviews`, `notifications`, `produce.is_custom` / `created_by`). Applied to the dev database, existing row counts unchanged.
- **Backend:** profile, change-password, forgot and reset endpoints; notifications module with `notify` inside the event transactions (orders, deliveries, bookings, reviews); partner and warehouse reviews with aggregates on lists and dashboards; custom produce rules (no band, off the price board and daily job); 26 new tests (118 total), lint clean.
- **Frontend:** `/account`, `/forgot-password`, the bell and panel, `/farmer/reviews`, farmer reviews panel on the shop, Rate delivery, Rate warehouse, partner ratings card, owner Recent reviews, "Add your produce" in the sell form; English and Malayalam text; lint and build pass.
- **Verified in the browser:** change profile and password; forgot password end to end (dev code, login after reset); bell badge, opening an item marks it read and navigates; notices reach the right roles and not a partner in the other region; buyer rated the delivery (and the "no stars" check) and the farmer; buyer read a farmer's reviews; partner ratings card; farmer rated a warehouse booking and sees it on the row; `/farmer/reviews`; farmer added "Drumstick leaves", listed it at ₹50 with no market price ("Price set by the farmer"); a buyer's listing request returns it with no market price; the price board does not contain it.
- Also verified: the owner sees "5 out of 5 from 1 review" on the warehouse card and the review in Recent reviews; the account page in Malayalam (no stray keys, layout fine).
- **Not verified in the browser:** the buyer's Add to cart on the custom item and its card in the shop; owner and booking notices (covered by backend tests); the rate-limit message and the offline message on the new screens; **Malayalam on the other new screens** (forgot password, reviews, bell, rating panels; key parity with English was checked by script, wording and layout were not looked at).
- **Mistakes this round:** see P18 and P19.

### 2026-10-30: Clean-up pass (loose ends)
- **Data:** old booking #4 corrected to its booked 11 days (5 to 15 Feb) and **₹11,000**; the ₹1,10,000 I quoted earlier was my arithmetic mistake (see lessons P15). The three warehouses now have 2 placeholder photos each.
- **Bug found and fixed:** with the server stopped, pressing an action showed 'Something went wrong' instead of 'Can't reach AgriChain…'. The proxy's reply (a 5xx with no JSON body) was recognised as a connection failure for the 404 page but not when choosing the message. `errorMessage` now uses `isConnectionError`. Also rounded the 'example total' on the farmer Storage page (₹1,005 instead of ₹1,005.00).
- **Checked in the browser (all worked):** owner adding photos to existing warehouses (and the 2-photo minimum), removing a photo, pause and open again, create and remove a warehouse, blocked pause and remove with open bookings; farmer requests; owner **Decline with a reason** (farmer sees it) and Accept; farmer **Cancel request** and **Cancel booking**; extension request, withdraw, owner Accept (end date and amount updated to 8 Nov, ₹1,000) and owner Decline (farmer sees the notice); the farmer-side delay notice ('Running about 30 min late: Traffic') then delivery; the plain 404 wording ('This field is empty…'); the red message with the server down; Malayalam on farmer Storage, owner Warehouses and its form, the buyer cart and partner Available (no stray text keys, layouts fine).
- **Still waiting for the user:** the Malayalam read-through, and which test data to remove (Database.md section 7).

### 2026-10-30: Warehouse prices and price hints
- **Why:** a 15-day booking came to ₹180, which the user said was far too low. The test price was my own guess.
- **Data:** prices set from the user's estimates: cold ₹1/kg/day (₹1,500 for 100 kg over 15 days), dry ₹0.67/kg/day (about ₹1,000); the seed uses ₹1 for cold. My test booking was re-created at the new price.
- **Frontend:** a note on the farmer Storage page that cold storage costs more (electricity), an example total ("100 kg for 15 days") under each price, and a dry / cold hint in the owner's warehouse form.
- **Verified in the browser:** the farmer page note and example totals; both owner hints (dry and cold).

### 2026-10-30: Warehouse owner side (and a new booking flow)
- **Why:** the warehouse owner had no pages. While planning, the user changed the booking rules: owner approval, date ranges, release or extend, overdue, delete when empty, mandatory photos.
- **Database:** migration `008_warehouse_requests_photos.sql`: `warehouse_photos`, `booking_extensions`, booking statuses `REQUESTED` / `REJECTED` / `CANCELLED`, stored price per booking, `warehouses.deleted_at`; **dropped `warehouses.available_capacity_kg`** (space is now computed per day from bookings).
- **Backend:** request, approve, decline, cancel, release, extend flow; per-day capacity; overdue (holds space, keeps charging); warehouse edit, pause and soft delete (refused with open bookings); photo upload with multer and file-type checks, served from `/uploads`; availability endpoint; owner dashboard fields; 23 new tests (92 total). Days are now counted inclusively.
- **Frontend:** owner pages Home, My warehouses (with photo upload and a per-quintal price hint) and Bookings; farmer Storage rebuilt with photos, date pickers, request statuses, extend and overdue handling; log in as a warehouse owner now lands on `/owner`.
- **Verified in the browser:** owner login and Home; form validation (empty, 1 photo, non-image); created a warehouse with 2 photos; farmer saw the photos in a gallery, picked dates (15 days, ₹180, free-space check) and sent a request; owner saw it under Requests, accepted it, it appeared under Active as "Starts soon"; the old February booking showed as Overdue on both sides; the Extend panel; Malayalam on the owner Bookings page.
- **Not verified in the browser:** see Open items. Backend tests cover decline, pause, remove, cancel, overdue, extensions and photo rules.
- **Needs the user's decision:** old booking #4 is now overdue with a huge charge (see Open items).

### 2026-10-30: Safer sessions (auto log off)
- **Why:** the user logged in as a farmer, restarted the servers the next day, and the site still showed "Go to dashboard". Cause: the JWT lasted 7 days and sat in `localStorage`, with no idle log off.
- **Answer to "is JWT implemented?":** yes (signed at login, verified on every protected request, expiry enforced). The weakness was the long lifetime and storage, not the signing.
- **Backend:** token lifetime 7 days → **1 hour**; new `POST /api/auth/refresh` (renews while active, hard cap of 12 hours since login); `auth_time` claim; 5 new tests (70 total).
- **Frontend:** token in `sessionStorage` (closing the browser logs out; each tab has its own login); **idle log off after 60 minutes** with a 60-second "Still there?" warning; token renewed every 20 minutes while active; the login page says why the user was logged out. The old `localStorage` token is deleted on load.
- **Verified in the browser** (with the timers shortened to 1 minute, then restored): stale `localStorage` token ignored and landing shows "Log in"; login stores the token in `sessionStorage` only; renewals while active; warning dialog, then logout to the login page with the inactivity notice; **Stay logged in** keeps the session; reload keeps the login; a bad token goes to login with "Your session expired".
- **Not verified:** the real 60-minute and 12-hour timings (tested by shortening the timers and by backend tests), Malayalam wording, and closing the whole browser (relies on `sessionStorage` behaviour).
- **To know:** restarting the server never logs anyone out (tokens are stateless). A token already issued stays valid until it expires; there is no "log out everywhere".

### 2026-10-30: Shopping cart
- **Why:** orders were one product each, so a buyer wanting several products from one farmer made several orders and paid several delivery fees.
- **Database:** migration `007_cart_and_order_items.sql`: new `order_items` and `cart_items`, `orders.farmer_id`; existing orders copied into one item each; `orders.listing_id`, `quantity` and `unit_price` dropped after the copy.
- **Backend:** new `/api/cart` endpoints; checkout splits into one order per farmer; delivery fee per order; `POST /api/orders` takes `items` and returns an array; order lists return `items` and `total_kg`; 14 new tests (65 total).
- **Frontend:** `/buyer/cart`, **Add to cart** on the shop, cart badge in the header; every order view shows the item list.
- **Answered:** the "Call …" link on order cards is a phone (`tel:`) link, so people on an order can phone each other.
- **Verified in the browser:** 3 items from 2 farmers became 2 orders with the right fees; the farmer saw "5 kg Carrot, 3 kg Potato" and accepted; the partner saw it in Available with the item list.
- **Not verified in the browser:** Malayalam on the cart page (keys match English; wording unchecked), removing an item, the out-of-stock message in the UI (covered by tests), and the partner taking and delivering a multi-item order in the UI (covered by tests).

### 2026-10-29: Delivery partner side and connection errors
- **Frontend:** partner pages Home, Available, My deliveries; `PartnerHeader`, `DelayPanel`; shared `CallLink`, `WeekBars`, `DelayNotice`, `DeliveryRoute`; login for partners goes to `/partner`.
- **Frontend:** a page that cannot load because of the connection now shows the 404 page with *Connection problem* wording and a **Try again** button. Actions still show a red message.
- **Frontend:** the sign-in check no longer sends the user to `/login` when the server is unreachable.
- **Backend:** `PATCH /api/deliveries/:orderId/delay` and `/release`; buyers and farmers see delay info on orders; partner dashboard gains `earned_today` and `earnings_last_7_days`.
- **Database:** migration `006_delivery_delay.sql` (`delay_reason`, `delay_minutes`, `delayed_at` on `orders`).
- **Tests:** 51 passing (new cases for delay, release, permissions, dashboard series).

### 2026-10-28 and before: Everything up to the buyer pages
- **Backend:** restructured into feature modules; JWT phone + password auth with four roles; ±20% price band; delivery flow; reviews; role-aware dashboard; warehouses and bookings; daily market price job with web scraper; rate limiting, Helmet, CORS, zod validation.
- **Database:** migrations 001 to 005 (initial schema, auth and integrity, delivery and reviews, market produce names, listing soft delete).
- **Frontend:** farmer pages (Home with price carousel, My produce with delete and stop selling, Orders, Storage); buyer pages (Home, Place order with search and vegetable/fruit filter, My orders with review); landing page; single login and sign-up with role choice; 404 page at `/404error`; English and Malayalam.
- **Design:** reference palette and typography adopted; deep-green side bands with the `field-lines.svg` pattern; market price carousel with the hike message beside the price.

## 6. Mistakes and lessons

This is the log that keeps the work aligned with the user's goals. Each row is something that was wrong, how the user corrected it, and the rule that follows. **Check this list before building.** Add a row every time the user corrects something.

### 6.1 Design and layout

| # | What went wrong | How it was corrected | Rule from now on |
|---|---|---|---|
| D1 | First designs looked "generic and AI made". | The user rejected two of them and supplied a reference site; the palette and typography were copied from it. | Use the reference tokens only. Never invent a new direction. |
| D2 | Built a phone-first layout. | "You are building for laptop right?" | Laptop-first with a top nav. |
| D3 | Buttons were too large. | "Don't want big buttons, standard ones." | Standard-size buttons everywhere. |
| D4 | The first side-pattern attempts (fruits, vegetables, icons) looked "off" and "bad". | The user asked for line patterns only, in a darker green, then "remove the fruits and everything, let it be only the pattern". | Side areas use only `field-lines.svg` on `#173d22`. No illustrations. |
| D5 | Left and right of the page were blank. | The user asked for the background pattern on both sides and in the header. | Fill the page edges with the pattern; keep header and sides consistent. |
| D6 | The page shifted sideways when moving between long and short pages. | Reported by the user; fixed with `scrollbar-gutter: stable`. | Check page-to-page layout stability when changing page height. |
| D7 | Price carousel: hike message in the wrong place; a pause button nobody wanted. | "Move the hike message to the right of the price, remove the pause button." | Do not add controls that were not asked for. |
| D8 | Farmer login still had the old left panel. | The user asked it to match the pattern and color design. | When a style changes, apply it to every page that shares it (login, sign-up, 404). |
| D9 | Landing page: title font "very bad", box too big, extra buttons ("Get started", a log in button). | Fonts, size and buttons changed; the user got sliders to place the box. Result stored as `{x: 8, y: -5.5, width: 472}`. | Keep the landing page minimal. Remove buttons the user did not ask for. |
| D10 | Swapped in a landing image the user then called boring. | "No this ones boring, change back." | Ask or keep the previous version available when trying an alternative. |
| D11 | The 404 page text used "Uh Oh". | "I liked the other texts that you used, Uh Oh don't need it." | No "Uh oh" wording. |
| D12 | The 404 route was named after login. | "Name the page as 404error." | The route is `/404error`. Unknown addresses redirect there. |

### 6.1b Security

| # | What went wrong | How it was corrected | Rule from now on |
|---|---|---|---|
| S1 | Auth shipped with a **7-day token in `localStorage`** and no idle log off. The user noticed a login still active the next day. | 1-hour token renewed while active, 12-hour cap, `sessionStorage`, idle log off with a warning (2026-10-30). | When building anything with login, decide session length, idle log off, where the token is stored and what happens on a shared computer **up front**, and say so in the plan. |

### 6.2 Content and features

| # | What went wrong | How it was corrected | Rule from now on |
|---|---|---|---|
| F1 | Too few produce options; no categories or search. | Two categories (vegetables, fruits) and a search box were added. | Cover the whole catalogue (80 items) and give a search plus category filter wherever a list is long. |
| F2 | Prices were not fetched on a schedule. | "The price should be fetched daily at a specific time." A 06:00 IST job with start-up catch-up was added. | Anything that changes daily is automated, not manual. |
| F3 | Other roles' login buttons did nothing when only the farmer login existed. | The user asked for an error; then asked for **one login for everyone** that redirects by role, with the role picked at sign-up. | Design auth once for all roles. |
| F4 | No way to delete a listing. | Stop selling and delete were added (soft delete, history kept). | Every created thing needs a way to be changed, stopped and removed. |
| F5 | Connection failures showed only a small error box. | The user asked for the 404 page, only when a page cannot load. | See [Frontend.md, Error handling](Frontend.md#7-error-handling). |
| F6 | Single-product orders: no cart, so one farmer's several products meant several orders and several delivery fees. | The user asked for a cart; built 2026-10-30 (one order per farmer). | Think about "many items" and "many of the same thing" when designing any create-flow. |
| F7 | I planned warehouse bookings as **instant** (auto-accepted, a number of days from today, no photos). The user rejected the plan: bookings need the owner's approval, real date ranges, release or extend at the end, delete when empty, and mandatory photos. | Plan rewritten around those rules and built. | For any flow between two roles, ask **who approves**, **what dates and states exist**, **what happens at the end**, and **what the other side needs to see** (photos) before planning. Explain real-world units (the user did not know how warehouses are priced) instead of just picking one. |

### 6.3 Malayalam

| # | What went wrong | Rule from now on |
|---|---|---|
| M1 | "ഒരു വാങ്ങുന്നയാൾ കാത്തിരിക്കുന്നു" was used for buyer; the user wanted ബയർ. | Use ബയർ / ബയർമാർ for buyer. |
| M2 | "പിന്തുടരൂ" was "not the word". | Do not translate word by word. Use natural everyday wording. |
| M3 | A status sentence was not natural Malayalam. | Always tell the user the Malayalam is unchecked and invite corrections. |

All Malayalam in `ml.json` is Claude-written and still needs a native check, especially the partner pages and delay reasons.

### 6.4 Process and tooling

| # | What went wrong | Fix and rule |
|---|---|---|
| P1 | A large shell heredoc failed with "unexpected EOF" and wrote nothing. | Create big files with the Write tool, not shell heredocs. |
| P2 | README text inside backticks was stripped by the shell. | Edit files with the Edit tool; never push markdown with backticks through the shell. |
| P3 | Used a Tailwind class that does not exist (`text-amber-ink`). | Use only tokens from `index.css` (`text-amber`, etc.). |
| P4 | Left an unused variable after extracting a component; lint caught it. | Run lint after every extraction. |
| P5 | Reloading with the server down went to `/login` instead of the 404. | The sign-in check now treats connection errors as "still loading". Test the *reload* path, not only in-app navigation. |
| P6 | **Try again** got stuck on the loader. | It now also refetches the `me` query. Test the recovery path, not only the failure. |
| P7 | Starting a preview server opened a new fronted tab and later browser calls hit the wrong tab. | Pass `tabId` explicitly and close tabs the server opens. |
| P8 | Test orders and listings were left in the dev database. | Clean up, or list them for the user ([Database.md, Test data](Database.md#7-test-data-left-in-the-development-database)). |
| P9 | Some checks were skipped and only mentioned at the end. | State what was *not* verified in the summary. |
| P10 | Used a big shell heredoc again for the cart files and it failed, exactly like P1. | Write multi-file code with the Write tool from the start; never a shell heredoc. |
| P11 | The dev server kept an old copy of `router.jsx` after two quick edits and showed a blank page ("Cart is not defined"). | After a multi-step edit, if the page is blank, check the console and `touch` the file before suspecting the code. |
| P12 | Used an alias (`region_id`) inside a SQL `WHERE`, which Postgres does not allow. Caught before running. | In SQL use the real column (`f.region_id`), not the select alias. |
| P13 | While writing the warehouse tests I left a nonsense cleanup block (`fs.rmSync` on a root path) at the end of a test file. I spotted and deleted it **before running anything**. | Never write a destructive filesystem call as a placeholder. Test cleanup uses a temp folder path that is spelled out, or nothing. |
| P16 | With the server down, a failed action showed the generic 'Something went wrong' instead of 'Can't reach AgriChain'. The connection check existed but the message code did not use it. Found only by testing with the backend stopped. | When a rule is decided in one helper (what counts as a connection failure), use that same helper everywhere the answer matters. Test the failure paths, not just the happy ones. |
| P17 | I wrote a shell command with backticks inside a double-quoted string again and one line of the doc came out blank. | Never put backticks in a shell command. Use the Edit tool for any text that contains them (same as P2). |
| P18 | I fixed many files with a script that replaced text using a placeholder (`'X'`); one replacement hit the wrong spot and corrupted `rejectExtension` in `bookings.service.js`. I noticed it, restored the function by hand and ran `node --check`. | For multi-file edits use the Edit tool with unique text, or make the script throw unless each pattern matches exactly once; run a syntax check and the tests straight after. |
| P19 | A few bugs only showed up by trying them: a wrong reset code returned 500 (untyped SQL parameters), a new token after a password change could be older than `password_changed_at`, and "Account type" showed lowercase "buyer". | Test wrong-input and edge paths for every new endpoint; compare timestamps at the same precision; show role names through their translated titles. |
| P15 | I told the user the old booking was "11 days, ₹1,10,000". The right figure is **₹11,000** (₹1,000 a day × 11). I had multiplied by ten too many. I found it while planning the clean-up and corrected chat, docs and data. | Re-do the multiplication (rate × kg × days) before quoting any money amount, and show the working. |
| P14 | The overdue rule makes an old, forgotten February test booking show an absurd charge (about ₹2,68,000). It exposed old data I had not looked at before changing booking rules. | Before changing a rule that reads old rows, list the old rows and say what will happen to them. |

## 7. Open items

- Warehouses #1 to #3 have **placeholder** photos (coloured boxes with text). Replace them with real photos.
- Test data waiting for your decision is listed in Database.md section 7. Open test bookings #7 and #9 stop warehouses #3 and #1 being paused or removed until they are released.
- Still unseen on screen: the farmer's **Take out** (release) and **Extend** on a booking that is overdue through the UI (checked with the old booking earlier and by backend tests), and the buyer and partner Malayalam beyond the cart and Available pages.
- Native check of all Malayalam text.
- Not re-checked in the browser: the wording of a plain missing-page 404; a failed *action* with the server down (should be a red message); the farmer-side delay notice visually; the **Mark delivered** confirm dialog (done through the API instead).
- Test data in the dev database still to be cleaned (see Database.md; orders #10 and #11 are from the cart test).
- Native check of all new warehouse Malayalam (`owner.*` and the new `storage.*` statuses; I used സംഭരണശാല for warehouse, അപേക്ഷ for request, സ്വീകരിക്കുക / നിരസിക്കുക for accept / decline).
- Native check of the Malayalam for the log off warning and notice (`auth.idleWarning*`, `auth.stay`, `auth.logoutNow`, `auth.sessionIdle`).
- A buyer can no longer order a single item in one tap (by design: everything goes through the cart). If a "Buy now" shortcut is wanted later, it needs a plan.
- Native check of all new Malayalam: `account.*`, `reviews.*`, `notifications.*` and the new `produce.*` text (I used ബയർ for buyer; check the notification sentences and rating wording).
- A real SMS provider for the reset code (replace `sendResetCode` in `utils/sms.js`); until then keep `RESET_CODE_IN_RESPONSE` off in production.
- Test data from this round is listed in Database.md section 7 (user #36, order #13, reviews, produce #108, 13 notifications).
- README screenshots, Docker, deployment.

## 8. How to keep this folder up to date

1. After any change, add a dated line to the Changelog (section 5).
2. Update the relevant document: UI or routes in Frontend, endpoints or rules in Backend, tables or migrations in Database.
3. After any correction from the user, add a row to section 6 with the rule it creates.
4. Move finished items out of section 7.
