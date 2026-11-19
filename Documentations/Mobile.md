# AgriChain: Mobile App

React Native + Expo app for AgriChain. Folder (planned): `mobileft\agrichain-mobile`. Back to the [main document](AgriChain-Main.md). The API it talks to is in [Backend.md](Backend.md).

> **Status: phone design agreed 2026-11-03 (section 4). No code and no tools installed yet.** **Design comes before code** (user decision 2026-10-31): first the phone design and the plan for how the app behaves on a phone are agreed (section 4), then Day 1 starts. This is first of all a **learning project**. **Claude writes the code; the user does not type it** and instead follows and understands the flow. Because of that, Claude must explain every step in plain words, must **not** build ahead of the day's plan, and must finish each day with "what you learned".

## 1. Decisions (2026-10-30)

| Choice | Decision | Why |
|---|---|---|
| Framework | **React Native + Expo** (JavaScript) | Same language and ideas as the website (React, hooks, TanStack Query, i18next, axios), so the user learns only the mobile layer. Flutter was compared and rejected for now: new language (Dart), nothing reusable, heavier Windows setup. |
| Test device | **Android phone and iPhone**, both with the Expo Go app (user has both, 2026-10-31) | Scan a QR code, no cable. Android is the main test device; check the iPhone now and then. |
| First scope | **Buyer role only** | Smallest set that teaches every core idea. Delivery partner is next. |
| Backend | **Reused as is.** The app is another client of the same `/api` | Almost no backend change needed. |
| Language | JavaScript, not TypeScript | Same as the website. |

## 2. How we work (rules for this document)

1. **One day = one lesson.** Roughly 1 to 2 hours. Each day has the same shape: *Idea* (plain words, web vs mobile) → *Build* (small steps, the user types) → *Check* (see it on the phone) → *What you learned* (3 to 5 lines) → *Document* (log in section 5).
2. **Claude builds, the user follows the flow.** Claude writes the code for the day in small steps, explains what each file and line group does and why, and the user checks the result on the phone and asks questions. The user does not type the code (decision 2026-10-31).
3. **Plan before each day.** At the start of each day Claude restates the day's goal and steps and the user agrees before anything is written.
4. **Everything is documented the same way as the website.** After every day: a line in the Mobile change log (section 5), a line in the main [Changelog](AgriChain-Main.md#5-changelog), mistakes in [Mistakes and lessons](AgriChain-Main.md#6-mistakes-and-lessons), and the day marked done in section 4.
5. All the working agreements in the main document still apply: **no git**, standard-size buttons, same palette and fonts, every label in **English and Malayalam** (Malayalam needs a native check), verify before saying done and say what was not checked.
6. The laptop-first rule is for the website. The app is made for the phone by nature, but keeps the same palette, fonts and standard buttons. A mockup is shown before each new screen style.

## 3. How a mobile app works (read once, come back when stuck)

| Web (what you know) | Mobile (React Native) |
|---|---|
| Runs in a browser | Installed on the phone, draws real native screens |
| `<div>`, `<p>`, `<button>`, `<input>` | `View`, `Text`, `Pressable`, `TextInput`, `Image`, `FlatList` (long lists) |
| CSS / Tailwind | JavaScript style objects (`StyleSheet`), flexbox. Tokens from `index.css` become `theme.js` |
| Pages and URLs, `react-router` | Screens in a stack or tabs, **Expo Router** (file-based) |
| `sessionStorage` | `expo-secure-store` (the token) and `AsyncStorage` (small settings) |
| `localhost:5000` | The phone's `localhost` is the phone. Use the laptop's network address |
| Browser CORS | Does not apply to native apps |
| Idle timer with mouse and keys | `AppState` (app in foreground or background) and touches |
| `tel:` link | `Linking.openURL('tel:...')` |
| Upload from a file picker | `expo-image-picker` |
| Deploy a website | Build an APK / AAB with EAS Build |

**Expo** is a toolkit on top of React Native that hides the Android and iOS build setup. **Expo Go** is a phone app that runs your code live while you develop. **Metro** is the dev server (like Vite).

**The tools, in one line each (Day 0):**
| Tool | What it is |
|---|---|
| Node 22 | Runs JavaScript on the laptop; Metro and all the tools run on it (checked: v22.21.0) |
| npm | Installs packages (checked: 10.9.4) |
| React Native | Draws real native screens from React code |
| Expo | Toolkit on top of React Native; no Android Studio or Xcode needed for development |
| Expo Go | Phone app that loads our app from the laptop while we build |
| Metro | Dev server on the laptop; sends the code to the phone and refreshes it when a file is saved |
| EAS Build | Later: builds the real installable app (APK/AAB) |

The phone and laptop must be on the same Wi-Fi, because the phone fetches the app from Metro over that network.

## 4. Design and phone plan (done BEFORE any code)

Nothing is built until the user approves this section. Each item below becomes a short agreed note here, with a **mockup shown before the screen is built** (same rule as the website).

> **One-page review of the whole design (all roles, English and Malayalam): [Mobile-Design.md](Mobile-Design.md).**

### 4.1 What a phone changes compared with the website
| Topic | Website (laptop) | App (phone) |
|---|---|---|
| Navigation | Top navigation | **Bottom tab bar** (reachable with the thumb), 4 to 5 tabs, with a stack of detail screens on top |
| Screen | Wide, many columns | One column, one thing at a time, long lists scroll |
| Buttons | Standard size | Standard size, but every tappable area at least 44 px high (finger, not mouse) |
| Panels (side panels) | Side panel | **Bottom sheet** or full screen |
| Hover, right-click | Used | Do not exist; everything must work by tap |
| Keyboard | Always there | Covers half the screen; forms must scroll above it |
| Connection | Usually stable | Drops often; offline and slow states must be designed |
| Session | Idle log off by mouse and keys | Leaving the app and coming back (`AppState`) |
| Notifications | Bell, polled | Bell now; real push later |
| Phone features | Few | Call, camera and gallery, share, maybe location |

### 4.2 D1: What stays, changes and drops (website buyer to phone). Done 2026-11-03
| Website | Phone |
|---|---|
| Top nav (Home, Place order, Cart, My orders) | Bottom tabs; Cart moves to the top bar; "Place order" is called **Shop** |
| Side panels (Add to cart, Rate, Reviews, Notifications) | **Bottom sheets**; Notifications is a full screen opened from the bell |
| Two-column login with an info panel on the left | Single column; the left panel becomes a short green band on top |
| Price ticker pauses on hover | Tap to stop, tap again to continue |
| Hover, tooltips | Removed; everything works by tap |
| Sign-up role cards (4 roles) | Kept: the app serves all four roles (see 4.8); the build order is still Buyer first |
| Account: two cards | Account list: Profile, Change password, Language, Log out |
| Warehouse, farmer and partner screens | Designed in 4.8 (2026-11-03); built after the Buyer |

### 4.3 D2: Navigation map. Done 2026-11-03
- **Signed out:** Splash, Log in, Sign up, Forgot password (two steps).
- **Signed in:** a top bar (logo, **Bell**, **Cart**, each with a count badge) over **4 bottom tabs: Home, Shop, Orders, Account** (user choice; the 5-tab version was not chosen).
  - Home: tap a farmer to open Shop filtered by that farmer.
  - Shop: Add-to-cart sheet; Farmer reviews sheet (tap the stars).
  - Orders: order detail (partner name, tap-to-call), Cancel confirm, **Rate this order** sheet (farmer and delivery stars).
  - Account: Edit profile, Change password, Language, Log out.
  - Cart: steppers per item, "Deliver to" line, Place order, order-placed screen.
  - Bell: Notifications list; tapping one opens the right screen and marks it read.

### 4.4 D3: Look and screens. Done 2026-11-03
Mockups were shown and revised three times on the user's feedback (see decisions below). Screens mocked (all in English, final style): Splash (described, not drawn), Log in, Sign up, Forgot password, Home, Shop, Add-to-cart sheet, Farmer reviews sheet, Cart, Deliver-to sheet, Order placed, Orders, Order details, Rate sheet, Notifications, Account. Malayalam was checked on Home, Shop, Cart and Orders.

**Decisions (user, 2026-11-03)**
- **Light only.** Same palette and fonts as the website. **Only the page background is green-tinted; cards, inputs, buttons and the tab bar stay white.** A "blended tones" variant (no white anywhere) was shown and not chosen.
- **Less crowded, but not sparse:** 20 px side margins, 16 px card padding, 12 to 18 px between blocks. Each card shows only what a buyer needs at a glance.
- **One number style everywhere:** prices, quantities, totals and counts are all Inter 15 px semibold with tabular digits. No big serif totals. Only the tab and bell badges (11 px) are smaller.
- **Market price strip:** items sit close together with a thin, low-opacity divider between them; it keeps the moving carousel; **tap to stop, tap again to continue**; no pause button.
- **Shop card:** name, "farmer · kg available", price at the top right, and a labelled full-width **Add to cart** button. The words stay because an icon alone is not clear enough for farmers and Malayalam readers. The "above / below market" note moves into the Add-to-cart sheet.
- **Home:** greeting, price strip, two farmer rows (no date pill, no star details).
- **Cart:** no trash icon; one "This order, with delivery" line per farmer; problems shown in red on the item itself. The delivery address is one small "Deliver to" line above Total with a **Change** link that opens a sheet (see 4.7 for the remember-last-address rule).
- **Orders:** one line for the items and one for the farmer on each card; partner name and call button are inside the order detail; one **Rate this order** button opens a sheet with farmer and delivery stars.
- **Malayalam check:** Home, Shop and Cart are shown in Malayalam before the design is frozen (open item).

**Phone design tokens (source for `theme.js` on Day 3)**
| Token | Value |
|---|---|
| Page background (tinted) | `#EAF1E4` (the website's sage) |
| Card, input, tab bar | `#FFFFFF`, border `#DCE6D2` |
| Icon circle | `#EAF1E4` with leaf `#4A7C3A` icon |
| Brand | forest `#1E4D2B` (buttons, headings, active tab), leaf `#4A7C3A`, deep green `#173D22` (price strip, login band, with the field-lines pattern) |
| Text | ink `#1C211B`, muted `#5B6158` |
| Status | amber `#8A5A00` (waiting, badges), sky `#175CD3` (on the way), danger `#B42318`, lime `#8CC63F` (price up on dark) |
| Fonts (English) | Lora (headings, 18 to 26 px), Inter (body 14 px, small 12 px, badges 11 px), **numbers Inter 15 px semibold, tabular** |
| Fonts (Malayalam) | **Anek Malayalam only**, for headings and body (no serif, no mixing): headings 18 px weight 700, body 13 px weight 400 to 500, small text and badges 11 px, line height 1.45. Numbers stay Inter 15 px semibold |
| Spacing | side margin 20, card padding 16, gap 12 to 18 |
| Radius | card 16, button and input 8, pill 99, bottom sheet 24 on top |
| Sizes | input and primary button 44 high, in-card button 36 high, stepper button 32 to 40, tab bar 58 |

### 4.5 D4: Phone behaviour rules. Done 2026-11-03
1. **Touch:** tappable areas at least 44 px; standard-size buttons; actions in thumb reach (Place order and Add to cart sit in a fixed footer or sheet).
2. **Keyboard:** forms scroll above it; Next moves between fields, Done submits; the phone field uses the number pad.
3. **Back:** Android back button and iPhone swipe-back go up one screen; sheets close on back or drag-down.
4. **Session and security (lesson S1, decided up front):** the token is kept in the phone's **secure store** (Keychain / Keystore), never plain storage. The 1-hour token is renewed while the app is in use (`/api/auth/refresh`), with the 12-hour cap. After **60 or more minutes in the background** the app asks to log in again and says why ("You were logged out because you were inactive"). Any 401 logs out with "Your session expired". Logging out clears the token and the cached data.
5. **Connection:** a screen that cannot load shows "Connection problem" with **Try again** (same idea as the website's 404). A failed action shows a red message and changes nothing. **Place order** is disabled while sending (no double orders); after a connection drop in the middle of checkout, the app re-reads the cart and orders before allowing another try.
6. **States on every screen:** loading skeleton, empty (an invitation plus one action), error with retry, success toast. Pull-to-refresh on Home, Shop and Orders.
7. **Text:** ₹ with Indian grouping, kg; Malayalam wraps to two lines and is never cut off.
8. **Two phones, one design.** Android is the main test device; iPhone safe areas (notch, home bar) are respected.
9. **Notifications:** the bell badge refreshes every 30 s while the app is open; real push is a later, optional step.
10. **Accessibility:** text follows the phone's font-size setting; tab icons always have a label.

### 4.6 Malayalam in the app. Checked 2026-11-03
Home, Shop, Cart and Orders were mocked in Malayalam (text from the website's `ml.json`, new lines marked below).
- **Font (user choice):** **Anek Malayalam** for the whole app in Malayalam, consistent everywhere; Manjari was the other option and was not chosen. The user asked for bolder headings like Manjari's, so headings use weight 700. Sizes are smaller than first drawn: body 13 px, small 11 px, headings 18 px.
- **Tab names (user choice):** **ഹോം · കട · ഓർഡർ · അക്കൗണ്ട്** (Home, Shop, Orders, Account). The website's longer names wrapped to two lines and made the tabs uneven; "ഓർഡർ ചെയ്യുക" stays only on the Place order button.
- **Order cards in Malayalam:** a long status such as "കർഷകന്റെ മറുപടിക്കായി കാത്തിരിക്കുന്നു" goes on its own line under the farmer name instead of beside the title.
- **Layout:** Malayalam needs line height 1.45 and makes cards a little taller, so fewer cards fit per screen. Prices like ₹48/കിലോ stay on one line. Long red messages wrap under the item.
- **Malayalam written by Claude, needs a native check:** കട (Shop tab), അക്കൗണ്ട് (tab), ഓർഡർ (tab, user's wording), "ഈ ഓർഡർ, ഡെലിവറി ഉൾപ്പെടെ" (cart line), "ഓർഡർ റേറ്റ് ചെയ്യുക" (Rate this order), "ആകെ, 2 ഓർഡറുകൾ" (cart footer), the farmer-row text "4.8 (12) · 4 ഇനങ്ങൾ", and the produce names (common usage, not checked against `lib/produce.js`).
- **Not verified:** how Anek Malayalam looks on a real phone. The font must be loaded into the app (Day 3).

### 4.7 Remaining screens and rules. Done 2026-11-03
- **Language toggle (user choice):** a small **EN | ML** pill (about 24 px high, 11 px text, current language highlighted), the same on every screen. On Login it sits at the right of the green band, vertically centred with the AgriChain logo; in Account it is the right end of the Language row. The label does not change with the language. The website's "മലയാളം" / "English" link is not used.
- **Splash:** the deep-green pattern band over the full screen with the logo and the tagline "From farm to market, without barriers." for about 1.5 seconds, then Login, or straight to Home if still logged in.
- **Log in:** green band with logo, toggle and the tagline, then Welcome back, phone, password, Forgot password?, Log in, "New to AgriChain? Create an account".
- **Sign up:** **no header or logo**, only a back arrow and the title "Create your account". Fields: name, phone, password, area (two chips), village or town. Four role cards in a 2x2 grid (Farmer "Sell your harvest", Buyer "Buy fresh produce", Warehouse owner "Rent out storage", Delivery partner "Deliver orders"). No language toggle on this screen; the language chosen on Login carries over.
- **Forgot password:** step 1 asks for the phone number; step 2 has six code boxes ("It works for 10 minutes."), new password, repeat password, Change password, "Send a new code", "Back to log in".
- **Notifications:** full screen from the bell, with back arrow, "Mark all read", unread dots, and text written from type and data as on the website. Tapping one opens the right screen.
- **Account:** profile card (initial, name, phone, area and role), then Edit profile, Change password, Language (EN | ML), Log out in red, and the note "Your phone number and area cannot be changed here."
- **Add-to-cart sheet:** item summary, the market note ("₹2 above today's market price (₹46)", or below, same, or "Price set by the farmer"), kg stepper, availability, produce cost, "Delivery is added when you order.", Add to cart.
- **Rate this order sheet:** stars for the farmer, stars for the delivery partner (only if there was one), optional comment, Send review.
- **Farmer reviews sheet:** opened by tapping a farmer's stars; average, 5-to-1 bars, review list with first names only.
- **Order placed:** "N orders placed", the farmer subtotals, **View my orders** and **Keep shopping**.
- **Order details:** opened by tapping an order card; progress line, call buttons for the farmer and the partner, produce, delivery and total.

**Delivery address rule (user decision 2026-11-03):** the Cart shows "Deliver to" with the address and a **Change** link.
- First order: it starts as the village or town from sign-up.
- When the buyer types a proper address in the sheet and places the order, that address is **remembered**, and the next order starts with it. The buyer should not have to retype it.
- To build: take it from the buyer's most recent order's delivery address (no backend change if the orders list returns it; **to verify before Day 19**), otherwise store it on the phone.
- The profile's village or town does not change.

**New English text to translate** (Claude-written, Malayalam needs a native check): "From farm to market, without barriers."; "Deliver to", "Change", "Save address", "Where should the delivery partner bring it?"; "N orders placed", "The farmers will confirm them soon. You will see updates in My orders.", "View my orders", "Keep shopping"; "Order details", "Delivery partner", "Farmer"; "Rate this order", "How was the delivery?", "Mark all read"; "Your phone number and area cannot be changed here."; "Edit profile"; "Language".

### 4.8 Farmer, delivery partner and warehouse owner. Designed 2026-11-03
Same tokens, same behaviour rules (4.4, 4.5), same top bar (logo and bell) as the buyer. Cart exists only for the buyer.

| Role | Bottom tabs | Screens drawn |
|---|---|---|
| Farmer | **Home, Produce, Orders** (new-order badge), **Storage, Account** (5 tabs) | Home (greeting, buyers waiting, Sell produce, market strip, "Needs your answer", 7-day earnings); My produce (Selling pill, kg left, price, market note, Change, Stop selling, Delete, Stopped section); Sell produce sheet (market price, price stepper with a plus or minus 20% ruler, kg stepper, total, Put for sale); Orders (New, In progress, Done; Accept or Reject); Storage (Warehouses and My storage; Book space sheet; overdue, in storage, waiting states); Account (My reviews with rating, Edit profile, Change password, EN or ML, Log out) |
| Delivery partner | **Home, Available** (waiting badge), **Deliveries, Account** | Home (waiting card, 4 stats, current delivery, 7-day earnings); Available (item, kg, km, "You earn", pickup and drop on a route line, Take this delivery); Deliveries (delay notice, call buttons, Mark delivered, Update delay, Give back); Running late sheet (reason chips, minutes chips, "Tell the buyer and farmer") |
| Warehouse owner | **Home, Warehouses, Bookings** (requests badge), **Account** | Home (alert strips, 4 stats, space bars); My warehouses (photo, cold or dry pill, rate, space bar, Change, Pause, Remove, disabled with the explanation when bookings are open); Add warehouse form (name, place, type, space, price, photos 2 of 5); Bookings (new and extension requests, Accept or Decline); Decline sheet (reason, "Yes, decline") |

**Decisions and rules**
- Farmer Reviews moved into Account ("My reviews") to keep the tab bar at five. Farmer Home has no rating card.
- **Buttons in a row never wrap on their own.** The farmer card has three equal 44 px buttons (Change, Stop selling, Delete); "Stop selling" is deliberately two lines, **centred both ways**, as the user chose. Single-action cards use one full-width 44 px button (partner Home "See available deliveries", Available "Take this delivery"), radius 8, never a pill.
- Partner Available card: item and km on the left, "You earn" on the right, Pickup and Drop on a vertical line with two dots, then the button.
- Stopped produce shows "Sell again" and Delete (my addition: **check against the website**). Partner Home stats (today, deliveries, week, rating) are placeholders until the real fields are checked.
- Not drawn yet, same pattern as above: warehouse reviews sheet, Extend sheet, Cancel and Take out confirm dialogs, Edit profile, Change password, empty states, Account for partner and owner, Malayalam for these roles.

**Status of section 4:** buyer design complete 2026-11-03 (all screens in English; Malayalam checked on four). Farmer, partner and owner designed on the same day (4.8) and approved by the user. Still open in section 9: native check of the Malayalam lines, the new text in Malayalam, the screens not drawn, and the real-phone look. **Design locked by the user on 2026-11-03** (white bars, compact role cards, current sizes); small size changes are expected after the first real-phone check on Day 3, and sizes live in one theme file so they are cheap to change. Build starts at Day 0, Buyer first.

## 5. The day-by-day build plan

Starts only after the design (section 4) is approved. Mark each day **Done YYYY-MM-DD** when finished. Days can be split if one takes too long; do not skip ahead.

### Week 1: Setup and screens
| Day | Goal | You learn | Result on the phone |
|---|---|---|---|
| 0 | Prepare: check Node 22, install Expo Go on both phones, create the folder `mobileft\agrichain-mobile`, read section 3 | What the tools are | Expo Go installed. **Done 2026-11-16** (Node 22.21.0, empty folder created, Expo Go installed per user) |
| 1 | Create the project (`create-expo-app`), run it, scan the QR code, edit the text and watch it update | Project folders, `app.json`, Metro, hot reload | "Hello AgriChain" **Done 2026-11-16** (blank template, Expo SDK 58, `npx expo start --lan`; "Hello AgriChain" updated live on Android and iPhone) |
| 2 | `View`, `Text`, `Image`, `Pressable`; build one static card (a produce card) | Core components, the render model | A produce card |
| 3 | Flexbox and `StyleSheet`; create `theme.js` from the website palette; add Lora + Inter | Layout, tokens, fonts | Styled card in the AgriChain look |
| 4 | Expo Router: a login screen and a sign-up screen (static) | Screens, navigation, safe areas, keyboard | Login and sign-up screens |
| 5 | Buyer tabs: Home, Shop, Cart, Orders, Account (empty screens) | Tab navigation, stacks inside tabs | Working tab bar |
| 6 | Review day: tidy, write the lessons so far, fix what felt unclear | Revision | Week 1 notes in this file |

### Week 2: Talking to the backend
| Day | Goal | You learn | Result |
|---|---|---|---|
| 7 | Let the phone reach the API (laptop network address, same Wi-Fi, plain http in development) | Why `localhost` fails, networking basics | A health check from the phone |
| 8 | axios client + secure token storage (`expo-secure-store`) | Tokens, secure storage | Client ready |
| 9 | Real login: `POST /api/auth/login`, `GET /api/auth/me`, redirect by role | Auth flow, context | Log in with the demo buyer |
| 10 | TanStack Query in the app; loading, empty and error states; the connection-error screen | Data fetching on mobile | Shared hooks and states |
| 11 | Token renewal (`/api/auth/refresh`) and logout on 401 | Session handling | Stays logged in, logs out when expired |
| 12 | Sign-up with region and role choice | Forms, validation | Create an account |
| 13 | Review day | Revision | Week 2 notes |

### Week 3: Buyer features
| Day | Goal | You learn | Result |
|---|---|---|---|
| 14 | Home: market price carousel (`/produce/prices`) | Horizontal lists, timers | Price carousel |
| 15 | Shop: `FlatList` of listings, search box | List performance, keys, search | Product list |
| 16 | Shop: category filter, produce card details, farmer rating | Filters, component design | Filtered list |
| 17 | Add to cart sheet (bottom sheet / modal) | Modals, forms | Add an item |
| 18 | Cart screen: quantities, per-farmer subtotals and fees, problem flags | State and mutations, cache updates | Working cart |
| 19 | Checkout: one order per farmer, success and failure messages | Multi-step actions, toasts | Place an order |
| 20 | Orders: list, status progress, cancel while waiting | Status UI, confirm dialogs | Orders screen |
| 21 | Rate the farmer and the delivery partner | Rating component, forms | Reviews work |
| 22 | Review day (full buyer flow test, compare with the website) | Testing a flow | Week 3 notes |

### Week 4: Polish and phone powers
| Day | Goal | You learn | Result |
|---|---|---|---|
| 23 | English and Malayalam (`i18next`, reuse `en.json` and `ml.json`), Malayalam fonts on Android | i18n on mobile | Language switch |
| 24 | Account: edit profile, change password | Reuse of the account API | Account screen |
| 25 | Forgot password (two steps) | Multi-step form | Reset works |
| 26 | Notifications bell and list (poll every 30 s) | Polling, badges | Notifications |
| 27 | Auto log off with `AppState` (replaces the web idle timer) | App lifecycle | Logs out after being away |
| 28 | Tap-to-call farmer or partner (`Linking`) | Calling native features | Call from an order |
| 29 | Pick and show a photo (`expo-image-picker`), photo addresses from the API | Permissions, files | Photo picker |
| 30 | Review day | Revision | Month 1 notes |

### Week 5 and after: Shipping and more
| Day | Goal | You learn |
|---|---|---|
| 31 to 32 | App icon, splash screen, app name; build an **Android APK** with EAS Build and install it without Expo Go | Dev build vs release build, versioning |
| 33 | Optional: push notifications (needs a `device_tokens` table and endpoint in the backend, with migration and tests) | What push really is |
| 34 | Optional: publishing to Google Play / App Store explained (fees, accounts, review). Backend must be deployed first (roadmap step 4) | Release process |
| Later | Delivery partner screens, then farmer, then warehouse owner (role-based tabs, like `ROLE_HOME` on the web); designs are in 4.8 | Reusing patterns |

## 6. Progress log and change log

Newest first. One entry per day worked.

| Date | Day | What we did | What was learned | Not verified |
|---|---|---|---|---|
| 2026-11-16 | Day 0 and Day 1 | Checked Node 22.21.0, made `mobileft\agrichain-mobile`, created the Expo project (blank template), ran Metro on the LAN, edited `App.js` and watched hot reload on both phones | iPhone Expo Go needs a free Expo account signed in on the phone and with `npx expo login` on the laptop (Android did not). `create-expo-app` ran `git init` and made an initial commit inside the project |
| 2026-11-03 | Design: other roles | Mocked farmer, delivery partner and warehouse owner screens with their own tabs; reworked partner Available and Home button, and the farmer Stop selling button after feedback | Rows of buttons need equal widths and a plan for long labels | Malayalam for these roles; not seen on a real phone; stats and "Sell again" not checked against the website |
| 2026-11-03 | Design complete | Mocked every remaining buyer screen (Sign up without header, Forgot password, Notifications, Account, Rate and reviews sheets, Deliver-to, Order placed, Order details, Login); EN | ML toggle made small and aligned with the logo; delivery address is remembered after an order | Remaining screens are English only; not seen on a real phone |
| 2026-11-03 | Malayalam check | Mocked Home, Shop, Cart, Orders in Malayalam; chose Anek Malayalam (headings bold), smaller sizes, tab names ഹോം · കട · ഓർഡർ · അക്കൗണ്ട് | Malayalam is taller and longer than English; one font and a tab-label limit keep it tidy | Not seen on a real phone; Claude-written lines need a native check |
| 2026-11-03 | Design D1 to D4 | Walked the buyer screens, drew the navigation map, mocked Log in, Home, Shop, Add-to-cart, Cart, Orders; revised three times on feedback; wrote the phone behaviour rules and design tokens (section 4) | A phone needs bottom tabs, sheets, 44 px touch areas and its own session rules | Not seen on a real phone; Malayalam layout not checked |
| 2026-10-31 | Planning | User has Android and iPhone; Claude writes the code and explains; **design and phone plan come first** (section 4), no code until approved | Why a phone needs its own design | Nothing built |
| 2026-10-30 | Planning | Chose React Native + Expo, Buyer first, wrote this day-by-day plan | Web vs mobile mental model (section 3) | Phone type not yet confirmed |

### Mobile mistakes and lessons
(Empty. Add a row here, and in the main document, every time something goes wrong or the user corrects something.)

| # | What went wrong | Rule from now on |
|---|---|---|
| MD1 | The first phone mockups looked crowded: too many items on each card, and prices and totals in different sizes (some small, some big serif). | Show only what is needed at a glance; leave room between blocks. Every number uses one style (Inter 15 px semibold, tabular). |
| MD2 | I tinted the cards green when asked for a green "background"; the user meant only the page background. | When asked to change a colour, change only the thing named. Offer a wider change as a separate option. |
| MD3 | I suggested a shorter, icon-only Add to cart button. | Keep words on key actions; icons alone are not clear for this audience (farmers, Malayalam readers). |
| MD4 | The farmer's "Stop selling" button wrapped to two lines, left-aligned, and the partner's "See available deliveries" button was an odd pill; I first redrew the wrong screens. | Use equal-width buttons at 44 px with text centred both ways, one button style app-wide. Look at the user's screenshot to find the exact element before redrawing. |
| MD5 | In the Malayalam Available screen I drew the route on the first delivery card only; the second card had no route. | Cards of the same kind use the same layout in every language; draw every card in full. |
| MD6 | In the mockup page the login header had no logo mark, the EN \| ML label was in a different font in Malayalam and was a plain label, the role cards were huge (a CSS rule also drew a box inside each box), and the price strip had no pattern. | Shared parts (logo, language toggle, price strip) are drawn once and reused. Latin letters and numbers are always Inter, Malayalam falls back to Anek Malayalam. The toggle is a two-part switch with the active language highlighted. Role cards are compact (icon, name, one-line hint). Decided 2026-11-03: top bar and tab bar stay white (option A); the dark striped version (option B) was compared in Mobile-Design-Header-Options.html and not chosen. The dark pattern is kept only for the login/sign-in header and the price strip. |

## 7. Files to reuse from the website
- `frontendft/agrichain/src/api/*.js`: TanStack Query hooks (same endpoints)
- `frontendft/agrichain/src/lib/`: `errors.js`, `format.js`, `pricing.js`, `orders.js`, `notifications.js` (mostly plain JS)
- `frontendft/agrichain/src/i18n/en.json` and `ml.json`
- `frontendft/agrichain/src/index.css`: colour tokens for `theme.js`
- Endpoints: [Backend.md section 6](Backend.md#6-endpoints). Demo buyer: phone 9791118801, password `AgriChain@123` ([main document section 2](AgriChain-Main.md#2-project-layout)).

## 8. Backend touch points
- CORS does not apply to native apps (no change).
- Photo addresses must use the API's full address on the phone (the web's `assetUrl` idea).
- Push notifications (Day 33) need a new table and endpoint, with a migration and tests.
- A phone away from home Wi-Fi needs a hosted API (roadmap step 4).

## 9. Open items
- Malayalam check done 2026-11-03 (section 4.6). Remaining: native check of the Malayalam lines Claude wrote, and the real-phone look of Anek Malayalam (Day 3).
- Translate the new English text listed in 4.7 into Malayalam and mock one more Malayalam screen if wanted.
- Verify whether the orders list returns the delivery address (for the remember-last-address rule) before Day 19.
- Check the other-role details in 4.8 against the website: partner Home stats, "Sell again" on stopped produce.
- Draw the screens listed as not drawn in 4.8 when their build days come, and check them in Malayalam.
- Then start Day 0.
- Folder is `mobileft\agrichain-mobile`, a new folder inside `FT_Project_Node` next to `backendft` and `frontendft` (created on Day 0, not yet).
- Malayalam in the app will need a native check, same as the website.
