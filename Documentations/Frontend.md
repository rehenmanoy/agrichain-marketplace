# AgriChain: Frontend

React web app, **laptop-first**. Folder: `frontendft\agrichain`. Back to the [main document](AgriChain-Main.md).

## 1. Stack

React 19 · Vite 7 · Tailwind CSS v4 (theme tokens in `src/index.css`) · react-router 7 (`createBrowserRouter`) · TanStack Query 5 · axios · i18next / react-i18next (English and Malayalam) · Phosphor icons (use the `…Icon` names) · ESLint. Import alias `@/` = `src/`. In development Vite proxies `/api` to `localhost:5000`.

| Script | Does |
|---|---|
| `npm run dev` | http://localhost:5173 |
| `npm run build` | Production build (`VITE_API_URL` = API address) |
| `npm run lint` | ESLint |

## 2. Structure

```
src/
  main.jsx / router.jsx     App start, QueryClient with connection-error handling; all routes
  index.css                 Theme tokens, base styles
  api/                      TanStack Query hooks per backend area
    buyer, cart, catalog, dashboard, listings, orders, owner, partner, storage
  auth/                     AuthContext (ROLE_HOME), AuthProvider (token + me query), RequireRole
  components/               Shared UI (see section 6)
  i18n/                     en.json, ml.json, index.js
  lib/                      api.js, errors.js, format.js, greeting.js, pricing.js, produce.js, farmers.js, ui.js
  pages/                    AuthLayout, LandingPage, Login, Signup, Error404Page, Misc,
                            buyer/, farmer/, partner/
public/                     field-lines.svg, hero-farm.webp, leaf.svg
```

## 3. Design system

Chosen from the reference site the user supplied ("exactly the same colour and typography"). **Do not change or add palettes.**

| Token | Hex | Use |
|---|---|---|
| forest | `#1E4D2B` | Primary buttons, headings |
| forest-deep / forest-hover | `#173D22` | Deep-green side bands, hover |
| leaf | `#4A7C3A` | Accents, eyebrow labels |
| sage / sage-strong | `#EAF1E4` / `#C9DDBF` | Icon circles, soft panels |
| paper | `#FAFAF7` | Page background |
| lime / lime-hover | `#8CC63F` / `#9DD352` | Landing and 404 accent |
| ink / muted | `#1C211B` / `#5B6158` | Text |
| line / line-soft | `#E5E9E0` / `#EEF1EA` | Borders |
| danger, amber, sky (+ soft) | `#B42318`, `#8A5A00`, `#175CD3` | Errors, warnings and delay, info |

- **Fonts:** Lora (serif) for headings, Inter for body, with Noto Serif / Sans Malayalam fallbacks. Tabular numbers on.
- **Headline style:** two lines, the second in leaf green. Uppercase leaf-green eyebrow labels above titles.
- **Sides:** the deep-green bands left and right of the page use only `field-lines.svg`. No fruit or vegetable art.
- **Buttons:** standard size (never large). `Button` and `ButtonLink` with variants primary, secondary, ghost.
- **Layout:** laptop width, top navigation (`AppHeader`), centred content in `AppShell`. `scrollbar-gutter: stable` stops sideways jumping.

## 4. Routes

| Path | Page | Who |
|---|---|---|
| `/` | Landing page | public |
| `/login`, `/signup` | One login for everyone; sign-up with role choice | public |
| `/404error` | Not found / connection problem | public |
| `/coming-soon` | Placeholder for any role without pages (none right now) | public |
| `/forgot-password` | Two steps: phone, then code and new password | public |
| `/account` | Edit profile and change password (header per role through `AccountLayout`, guarded by `RequireAuth`) | any signed-in user |
| `/farmer`, `/farmer/produce`, `/farmer/orders`, `/farmer/storage`, `/farmer/reviews` | Farmer pages | FARMER |
| `/owner`, `/owner/warehouses`, `/owner/bookings` | Warehouse owner pages | WAREHOUSE_OWNER |
| `/buyer`, `/buyer/shop`, `/buyer/cart`, `/buyer/orders` | Buyer pages | BUYER |
| `/partner`, `/partner/available`, `/partner/deliveries` | Partner pages | DELIVERY_PARTNER |
| anything else | Redirects to `/404error` | |

`RequireRole` sends a signed-out visitor to `/login`. After login `ROLE_HOME` decides the landing page: farmer `/farmer`, buyer `/buyer`, partner `/partner`, warehouse owner `/owner`.

## 5. Pages

### Landing, login, sign-up
- **Landing:** hero photo with a small box; the box position is `{x: 8, y: -5.5, width: 472}` (the user tuned it with sliders; it lives in `CardTuner.jsx`). No extra buttons beyond what was asked.
- **Login:** phone + password for all roles; the AgriChain logo returns to the landing page; the language switch is clearly visible. **Sign-up:** the user picks their role.
- Left side of login and sign-up uses the same pattern and colour as the rest.

### Account, password reset, notifications (every role)
- **Account `/account`** (open it by clicking your name in the header): *Profile* card (name and place editable; phone, area and account type shown but fixed, with a note why) and *Change password* card (current, new, repeat; the server answers with a fresh login that replaces the old one).
- **Forgot password `/forgot-password`** (link on the login page): step 1 phone; step 2 the 6-digit code and a new password. In development a box shows "Development only: your code is …" (from `dev_code`); in production nothing is shown. After success the login page shows a "password changed" notice.
- **Bell** in `AppHeader` for every role: unread badge, polls every 30 s, opens `NotificationsPanel`. Each item is written from `type` + `data` in the reader's language (`lib/notifications.js` `notificationKey`), shows how long ago (`timeAgo`), and clicking it marks it read and goes to the right page (`notificationLink`). "Mark all read" at the top.

### Farmer
| Page | What it does |
|---|---|
| Home `/farmer` | Today's market price carousel (hike message beside the price, no pause button); produce on sale with the fair-price ruler; new orders to accept; earnings and rating |
| My produce | Sell produce (price limited to ±20%), change stock or price, stop selling, restart, delete. **"Can't find your produce? Add it"** in the picker opens `NewProducePanel` (name, vegetable or fruit); the new item is selected and the form shows an amber "no market price, you set the price" note and a free price field (no fair-price ruler). Such items show "Price set by the farmer" |
| Reviews `/farmer/reviews` | `RatingSummary` (average, count, 5-to-1 bars) and `ReviewList` of every review with comment, buyer first name, products and date |
| Orders | Accept or reject new orders, follow them through delivery, see delay notices |
| Storage | Warehouses near you with a photo each; **View and book** opens a panel with the photo gallery, produce, **From / Until date pickers** (inclusive days and cost), and kg limited by the space free on all those days; **Send request** (the owner must accept). The list starts with a short note that cold storage costs more because of electricity, and each warehouse shows an example price ("100 kg for 15 days: ₹1,500") under its daily rate. Each warehouse shows its rating, which opens `WarehouseReviews`; after a booking is taken out the row offers **Rate warehouse** (and then "You rated it N out of 5"). **My storage** shows each booking's state: *Waiting for the owner* (Cancel request), *Approved* (Cancel booking before it starts), *In storage* (days left, **Take out**, **Extend**), *Overdue* (red, charge so far, Take out or Extend), *Extension waiting / declined* (Withdraw), *Declined* (with the owner's reason), *Taken out*. Overdue and waiting bookings are listed first |

### Buyer
| Page | What it does |
|---|---|
| Home `/buyer` | Same price carousel, farmers near you, latest orders, spending |
| Place order `/buyer/shop` | Search all produce in the region, vegetables / fruits filter; each card has **Add to cart**, which opens a panel to pick the kilograms (`AddToCartPanel`) |
| Cart `/buyer/cart` | One card per farmer with their items (− / + and remove), that farmer's subtotal and delivery fee. Items that cannot be ordered show a red reason and block checkout. Side summary with the delivery address, total and **Place order**, which makes one order per farmer. The header **Cart** link shows an item-count badge |
| My orders | Status progress line, cancel while waiting, delay notice, **Rate farmer** and **Rate delivery** after delivery (`ReviewPanel` takes a target: farmer or partner) |

On the shop, the farmer's rating on each card is a button that opens the farmer's reviews (`ReviewsPanel`).

### Delivery partner
| Page | What it does |
|---|---|
| Home `/partner` | Greeting and status line; four numbers (earned, completed, on the way, waiting); current delivery; 7-day earnings bars; ratings card (average, opens the reviews); "How you earn" note |
| Available | Cards with produce, kg, fee, pickup and drop; **Take this delivery**; a 409 shows "Another partner took this order" |
| My deliveries | **On the way**: call farmer / buyer, **Mark delivered** (confirm), **Running late** (reason + 15/30/45/60/90 min), **Give back** (confirm). **Delivered** history and total earned |

### Warehouse owner
| Page | What it does |
|---|---|
| Home `/owner` | Greeting and status line ("2 requests are waiting for your answer"); four numbers (warehouses, space in use %, active bookings, booking income); coloured alerts for waiting requests, extension requests and overdue bookings; each warehouse with its space bar; latest bookings; a **Recent reviews** card from farmers |
| My warehouses `/owner/warehouses` | One card per warehouse (photo, place, cold or dry, price with the per-quintal monthly equivalent, space bar, open bookings). **Add warehouse** and **Change** open `WarehousePanel`: name, place, dry or cold, total kg, price per kg per day (live hint "about ₹X per quintal per month"), a one-line hint under the dry / cold choice (cold costs more because of electricity), and a **photo picker with previews (2 to 5 required, JPEG/PNG/WebP, 5 MB each)**. **Pause bookings / Open again** and **Remove** (confirm dialogs); both are disabled with an explanation while the warehouse has waiting or approved bookings |
| Bookings `/owner/bookings` | Tabs **Requests** (new requests and extension requests: **Accept**, **Decline** with an optional reason), **Active** (overdue first, with a **Call** link to the farmer), **Past**. The header badge counts what is waiting |

## 6. Shared components and helpers

| File | Purpose |
|---|---|
| `AppHeader`, `FarmerHeader`, `BuyerHeader`, `PartnerHeader`, `OwnerHeader` | Top navigation per role (partner and owner show a waiting-count badge) |
| `SpaceBar` | "400 kg free of 1,000 kg" bar, shared by farmer Storage and the owner pages |
| `PhotoGallery`, `WarehouseThumb` | Large photo with small ones to switch between; a square cover photo (a sun or snowflake icon when there are none) |
| `lib/storage.js` | `inclusiveDays`, `daysFromToday`, `perQuintalPerMonth`, and the photo and booking limits that mirror the backend |
| `lib/api.js` `assetUrl` | Full address of a photo, with `VITE_API_URL` when the API is on another origin (`vite.config.js` proxies `/uploads` in development) |
| `AppShell` | Page frame |
| `Brand` | Logo and language switch |
| `Bits` | Card, Pill, Eyebrow, IconCircle, ProduceMark, PageHeader |
| `Button`, `Field`, `Dialogs` (ConfirmDialog), `Loader` (skeletons, empty and error states), `Stepper`, `StarRating` | Form and feedback pieces |
| `ToastProvider` / `toast-context` | Red and green messages after actions |
| `MarketTicker` | Market price carousel |
| `PriceRuler` | Fair-price band |
| `ProducePicker` | Search plus category filter |
| `OrderStatus`, `OrderDecision` | Progress line; accept / reject |
| `CallLink` | Phone link (shared by farmer, buyer, partner): a `tel:` link that opens the phone dialler so people on an order can call each other |
| `OrderItems` (`OrderMark`, `OrderItemLines`) | Round icon (the produce, or a basket for several items) and the item lines of an order. Used on every order view |
| `lib/orders.js` | `orderTitle` ("6 kg Tomato" or "3 items · 8 kg"), `itemsText` ("2 kg Carrot, 3 kg Cabbage") and `produceNames` for sentences and dialogs |
| `WeekBars` | 7-day bars (`valueKey`: `revenue` or `earned`) |
| `DelayNotice` | Amber "Running about N min late: reason", only while out for delivery |
| `DeliveryRoute` | Pickup (farmer) and drop (buyer) with optional call links |
| `lib/api.js` | axios client and `isConnectionError` |
| `lib/errors.js` | API error to translated message |
| `lib/format.js` | Rupees, numbers, dates by language |
| `lib/produce.js` | Produce names in English and Malayalam |
| `lib/pricing.js` | Price band maths |
| `RatingSummary`, `ReviewList`, `ReviewsPanel`, `RatingPanel`, `WarehouseReviews` | Average and bars; list of reviews; side panels for a farmer's, partner's and warehouse's reviews |
| `NotificationBell`, `NotificationsPanel`, `lib/notifications.js` | The bell, its list, and the type → text key and link mapping |
| `RequireAuth`, `AccountLayout` | Guard and header choice for pages every role shares |
| `api/account.js`, `api/reviews.js`, `api/notifications.js` | Profile and password hooks; farmer, partner and warehouse review hooks; bell hooks (poll 30 s) |
| `lib/format.js` `timeAgo` | "5 minutes ago" in both languages |

An order has `items` (a list) and `total_kg`; never read `order.produce_name` or `order.quantity` (they no longer exist). Use `OrderMark`, `orderTitle` and `itemsText`.

Data hooks live in `src/api/*.js` (`cart.js` holds the cart hooks; cart mutations that return the cart write it straight into the query cache). Partner hooks poll (available every 20 s, mine every 30 s); mutations invalidate `deliveries`, `orders` and `dashboard`.

## 6b. Login session and automatic log off

Added 2026-10-30 after the user found a login still active the next day.

- **Where the token lives:** `sessionStorage` (`lib/api.js`), so closing the browser or tab logs the user out. Reloading a tab keeps the login. Each tab has its own login, so a new tab asks to log in again. The old `localStorage` copy is deleted on load.
- **Idle log off:** `auth/useSessionTimers.js`, started by `AuthProvider` while someone is signed in. After **60 minutes** of no pointer, key, scroll or touch activity the user is logged out. Background polling does not count as activity. The last-activity time is stored per browser session (`auth/session.js`), so a reload or a sleeping laptop is judged correctly.
- **Warning:** the last 60 seconds show a dialog "Still there?" with a countdown, **Stay logged in** and **Log out now**. Only the buttons count; moving the mouse does not dismiss it (Esc counts as staying).
- **Renewal:** while the user is active, every 20 minutes the app calls `POST /api/auth/refresh` and swaps in the fresh token (through `signIn`, so no loading flash). A login can be renewed for at most 12 hours in total (backend rule), then the user must log in again.
- **Why they were logged out:** `logout('idle')` or `logout('expired')` stores a one-time reason; the login page shows it ("You were logged out because you were inactive…" or "Your session expired…"). Any 401 on a signed-in request logs out with `expired`.
- **Testing:** set `VITE_IDLE_MINUTES=1` in a temporary `frontendft/agrichain/.env.local` to shrink all timers (idle 1 min, warning 20 s, renewal every 20 s), then delete the file.

## 7. Error handling

- **Page cannot load because of the connection** → the 404 page with state `{ reason: 'connection', from }`. It shows "Connection problem", a lime **Try again** button (re-checks the sign-in and returns to the page) and **Back to home**.
- **How it is decided:** `isConnectionError(error)` is true when the request got no response (not a cancel), or the status is 502/503/504, or a 5xx without the API's JSON `{ error }` body (the Vite proxy's answer when the API is down). The `QueryCache` `onError` in `main.jsx` redirects only when the query has no data yet and we are not already on `/404error`.
- **Sign-in check:** `AuthProvider` treats a connection failure as "still loading", so the user is not thrown to `/login` when the server is down.
- **Actions** (accept, order, mark delivered…) never redirect; they show a red toast or form message. When the server cannot be reached the message is "Can't reach AgriChain. Check your internet connection and try again." (`errorMessage` in `lib/errors.js` uses `isConnectionError`, so the dev proxy's body-less 5xx reply is recognised too; fixed 2026-10-30 after testing with the backend stopped).
- **Unknown address** → `/404error` with the normal "page not found" wording (no "Uh oh").

## 8. Language

- `en.json` and `ml.json`; every visible label has both. Plural keys use `_one` / `_other`.
- Buyer is **ബയർ / ബയർമാർ**. Write natural Malayalam, not word-for-word.
- All Malayalam written by Claude must be checked by the user. Open items are listed in the main document.

## 9. Frontend change log

| Date | Change |
|---|---|
| 2026-10-28 | Farmer pages; theme from the reference site; Lora + Inter; patterns on both sides and the header |
| 2026-10-28 | Price carousel; produce categories and search; delete / stop selling |
| 2026-10-28 | Landing page, single login, sign-up with role choice, 404 page at `/404error` |
| 2026-10-28 | Buyer pages: Home, Place order, My orders with review |
| 2026-10-29 | Connection errors → 404 with Try again; sign-in check no longer redirects to login when the server is down |
| 2026-10-29 | Partner pages (Home, Available, My deliveries), delay panel, shared `CallLink`, `WeekBars`, `DelayNotice`, `DeliveryRoute`, `PartnerHeader` |
| 2026-10-29 | `errors.alreadyTaken`, `partner.*`, `delay.*` and `notFound.connection*` text in English and Malayalam |
| 2026-10-30 | Shopping cart: `/buyer/cart` page, **Add to cart** replaces **Order** on the shop (`OrderPanel` replaced by `AddToCartPanel`), Cart link with badge in `BuyerHeader`, `api/cart.js` |
| 2026-10-30 | Orders hold several items: new `OrderItems` and `lib/orders.js`; buyer Orders, Dashboard and ReviewPanel, farmer Orders, Dashboard and `OrderDecision`, partner Home, Available, My deliveries and `DelayPanel` all show the item list |
| 2026-10-30 | Price hints: farmer Storage shows a cold-vs-dry note and an example total per warehouse; the owner form shows a dry / cold hint (`storage.coldVsDry`, `storage.sample`, `owner.form.dryHint`, `owner.form.coldHint`; Malayalam needs a check) |
| 2026-10-30 | Warehouse owner pages (Home, My warehouses with `WarehousePanel` and photo upload, Bookings with accept / decline), `OwnerHeader`, `ROLE_HOME.WAREHOUSE_OWNER = '/owner'`; farmer Storage rebuilt (photos, date-range requests, statuses, `StorageBookingRow`, `ExtendPanel`, `PhotoGallery`, `SpaceBar`); `api/owner.js`, `api/storage.js` extended; `owner.*` and new `storage.*` text in English and Malayalam (needs a check) |
| 2026-10-30 | Safer sessions: token moved to `sessionStorage`; idle log off after 60 min with a 60-second warning (`useSessionTimers`, `session.js`); token renewal while active; reason notice on the login page; `ConfirmDialog` gained `onCancel` and `cancelLabel`; text `auth.idleWarning*`, `auth.stay`, `auth.logoutNow`, `auth.sessionIdle` (Malayalam needs a check) |
| 2026-10-30 | Text: `cart.*`, `orderItems.*`, `nav.cart`, `errors.notEnoughOf` / `itemGone` in English and Malayalam (Malayalam needs a check); dialog texts now take `{{items}}` |
| 2026-10-30 | Account page (profile, password), forgot password, bell and notifications panel, farmer Reviews page, buyers read farmer reviews, rate delivery partners and warehouses, farmers add custom produce (no market price), partner ratings card, owner recent reviews; new `account.*`, `reviews.*`, `notifications.*`, `produce.*` text in English and Malayalam (**Malayalam needs a check**) |

## 10. Rules for frontend work

1. Use only the tokens in `index.css`; check a class exists before using it.
2. Laptop-first, top nav, standard buttons. Show a mockup before a new page style.
3. Add both English and Malayalam for every label; say the Malayalam needs a check.
4. Reuse shared components; extract duplicates rather than copying.
5. Loading, empty and error states for every list; red message for failed actions.
6. Test the reload path and the recovery path, not just in-app navigation.
7. Run `npm run lint` and `npm run build`, check in the browser at laptop size, then reset the viewport.
8. Update this file and the main changelog.
