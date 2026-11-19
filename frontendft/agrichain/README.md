# AgriChain web app

The website for AgriChain: farmers sell produce at a fair price, accept orders and book storage. The farmer pages are built first; pages for buyers, delivery partners and warehouse owners come next.

## Tech stack
React 19 · Vite · Tailwind CSS v4 · React Router · TanStack Query · axios · i18next (English and Malayalam) · Phosphor icons

## Getting started
The API in `../../backendft` must be running on port 5000. In development, Vite forwards `/api` to it.

```bash
npm install
npm run dev        # http://localhost:5173
```

Log in with a demo farmer: phone `9991110001`, password `AgriChain@123`.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` (set `VITE_API_URL` to the API's address) |
| `npm run lint` | ESLint |

## Farmer pages
| Page | Path | What it does |
|---|---|---|
| Login / sign-up | `/login`, `/signup` | One login for every role (phone and password); the account's role decides where it lands (farmers to `/farmer`, other roles to a "coming soon" page until their pages exist). New farmers create an account |
| Home | `/farmer` | Today's market prices, produce on sale with the fair-price ruler, new orders to accept, earnings and rating |
| My produce | `/farmer/produce` | Sell produce (price limited to ±20% of today's market), change stock or price, stop and restart selling |
| Orders | `/farmer/orders` | Accept or reject new orders, follow them to delivery |
| Storage | `/farmer/storage` | See warehouses near you with photos, ask for space for a date range (the owner approves), then take produce out or ask to extend; overdue bookings are flagged |

| Reviews | `/farmer/reviews` | Your average rating, how many stars each score got, and every review with its comment |

Farmers can also add a produce type that is not in the list ("Can't find your produce? Add it" in the sell form). It has no market price, so you set the price and buyers see "Price set by the farmer". Storage rows show each warehouse's rating and let you rate a warehouse after taking your produce out.

## Every role
| Page | Path | What it does |
|---|---|---|
| Account | `/account` | Click your name in the header: change your name and place, or your password (phone and area stay fixed) |
| Forgot password | `/forgot-password` | Enter your phone, then the one-time code and a new password. In development the code is shown on the page |
| Bell | in the header | Notices about orders, deliveries, bookings and reviews, in your language; click one to open the page it is about |

## Buyer pages
| Page | Path | What it does |
|---|---|---|
| Home | `/buyer` | Today's market prices, farmers near you, your latest orders and spending |
| Place order | `/buyer/shop` | Search all produce in your region, filter vegetables or fruits, and add items to your cart |
| Cart | `/buyer/cart` | Items grouped by farmer with change and remove; delivery fee per farmer; one **Place order** makes one order per farmer |
| My orders | `/buyer/orders` | Order status with a progress line, cancel while it's still waiting, recent orders, and rating the farmer and the delivery partner after delivery. On the shop, tap a farmer's rating to read their reviews |

## Delivery partner pages
| Page | Path | What it does |
|---|---|---|
| Home | `/partner` | Earnings (total, today, last 7 days), deliveries done, on the way and waiting near you |
| Available | `/partner/available` | Orders farmers accepted in your region; the first partner to take one gets it |
| My deliveries | `/partner/deliveries` | Call the farmer and buyer, mark delivered, report a delay (buyer and farmer see it) or give a delivery back |

## Warehouse owner pages
| Page | Path | What it does |
|---|---|---|
| Home | `/owner` | Warehouses, space in use, active bookings and income; alerts for waiting requests, extension requests and overdue bookings |
| My warehouses | `/owner/warehouses` | Add a warehouse (**2 to 5 photos required**, price per kg per day with a per-quintal monthly hint), change it, pause or remove it when it has no open bookings |
| Bookings | `/owner/bookings` | **Requests** (accept or decline new requests and extension requests), **Active** (overdue first, call the farmer), **Past** |

## When the server can't be reached
A page that can't load because of the connection shows the 404 page with a *Connection problem* message and a **Try again** button (see `isConnectionError` in `src/lib/api.js` and the query cache in `src/main.jsx`). Actions such as accepting an order show a red message instead.

## Structure
```
src/
  api/          TanStack Query hooks per backend module
  auth/         login state (token + current user) and role guard
  components/   shared UI: buttons, panels, price ruler, steppers, order steps
  i18n/         en.json and ml.json, every visible label
  lib/          API client, formatting, pricing rules, produce names
  pages/        landing, login, sign-up, 404 and the farmer, buyer, partner and warehouse owner pages
```

The Malayalam text in `src/i18n/ml.json` should be checked by a native speaker before demos.
