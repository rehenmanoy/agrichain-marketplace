# AgriChain Mobile: Complete Design (one-page review)

All design decisions made on **2026-11-03**, for all four roles, in English and Malayalam, in one file for a final check before building. The full history and reasons are in [Mobile.md section 4](Mobile.md#4-design-and-phone-plan-done-before-any-code). Back to the [main document](AgriChain-Main.md).

> **Pictures of the screens:** open [Mobile-Design-Mockups.html](Mobile-Design-Mockups.html) in a browser (needs internet for fonts and icons). English and Malayalam side by side for every role.
> **Status:** design agreed for review. **No code and no tools installed yet.** Mockups were shown in the chat (they are not stored as files); everything they showed is written down here.
> **Malayalam:** lines from the website's `ml.json` are marked **(web)**; lines Claude wrote for the app are marked **(new)** and need a native check. Nothing has been seen on a real phone.

## 1. App basics
| Topic | Decision |
|---|---|
| Framework | React Native + Expo, JavaScript. Expo Go on Android and iPhone for testing |
| Backend | Reused unchanged: same `/api`, phone + password login, 4 roles |
| Build order | Buyer first, then delivery partner, farmer, warehouse owner |
| How we work | Claude writes and explains the code; the user follows and checks on the phones. One day = one lesson. No git by Claude |
| Language | Whole app in English or Malayalam, switched with a small **EN \| ML** pill (same label in both languages) |

## 2. Look (applies to every role)
| Item | Decision |
|---|---|
| Mode | Light only |
| Page background | Green tint `#EAF1E4`. **Only the page** is tinted |
| Cards, inputs, buttons, tab bar | White `#FFFFFF`, border `#DCE6D2` |
| Brand colours | Forest `#1E4D2B` (buttons, headings, active tab), leaf `#4A7C3A`, deep green `#173D22` (price strip, login band, field-lines pattern) |
| Text | Ink `#1C211B`, muted `#5B6158` |
| Status colours | Amber `#8A5A00`, sky `#175CD3`, danger `#B42318`, lime `#8CC63F` (price up, on dark) |
| English fonts | Lora headings (18 to 26 px), Inter body 14 px, small 12 px, badges 11 px |
| Numbers | **One style everywhere:** Inter 15 px semibold, tabular digits |
| Malayalam font | **Anek Malayalam only.** Headings 18 px weight 700, body 13 px, small 11 px, line height 1.45. Numbers stay Inter |
| Spacing | Side margin 20, card padding 16, gaps 12 to 18 |
| Radius | Card 16, button and input 8, pill 99, bottom sheet 24 on top |
| Sizes | Input and primary button 44 high, tab bar 58, stepper 32 to 40 |
| Buttons | One standard style. Rows of buttons are **equal width, 44 px high, text centred both ways**. A long label may use two lines, centred. Words are kept on key actions (no icon-only buttons) |
| Top bar | AgriChain logo and the Bell (with count). The buyer also has the Cart |

## 3. Navigation per role
| Role | Bottom tabs (English) | Tabs (Malayalam) |
|---|---|---|
| Buyer | Home, Shop, Orders, Account. Cart and Bell in the top bar | ഹോം · കട · ഓർഡർ · അക്കൗണ്ട് |
| Farmer | Home, Produce, Orders (new-order badge), Storage, Account | ഹോം · വിളകൾ · ഓർഡർ · സംഭരണം · അക്കൗണ്ട് **(new)** |
| Delivery partner | Home, Available (waiting badge), Deliveries, Account | ഹോം · ലഭ്യമായവ · ഡെലിവറി · അക്കൗണ്ട് **(new)** |
| Warehouse owner | Home, Warehouses, Bookings (requests badge), Account | ഹോം · സംഭരണശാല · ബുക്കിംഗ് · അക്കൗണ്ട് **(new)** |

- Side panels of the website become **bottom sheets**; Notifications is a full screen from the Bell.
- Farmer Reviews live in **Account > My reviews** (keeps the tab bar at 5).
- Buyer tab names were chosen by the user. The other roles' names are Claude's suggestion.

## 4. Behaviour rules (every role)
1. Tappable areas at least 44 px. Main actions in thumb reach.
2. Forms scroll above the keyboard; Next / Done; number pad for phone numbers.
3. Android back and iPhone swipe-back go up one screen; sheets close on back or drag-down.
4. Token in the phone's secure store. Renewed while in use (1 hour token, 12 hour cap). After 60+ minutes in the background, ask to log in again and say why. A 401 logs out with "Your session expired". Logout clears token and cached data.
5. Screen cannot load: "Connection problem" with **Try again**. A failed action: red message, nothing changes. Buttons that send (Place order, Take this delivery) are disabled while sending; after a drop, re-read the data before retrying.
6. Every screen has loading, empty, error and success states. Pull-to-refresh on lists.
7. ₹ with Indian digit grouping. Malayalam wraps, never cut off.
8. Android is the main test phone; iPhone safe areas respected.
9. Bell refreshes every 30 seconds while the app is open. Real push is a later option.
10. Text follows the phone's font size; tab icons always have labels.

## 5. Signed-out screens (all roles)
| Screen | Contents | Malayalam |
|---|---|---|
| Splash | Deep-green pattern, logo, tagline, about 1.5 s | "കർഷകരിൽ നിന്ന് നേരിട്ട്" (web tagline). English "From farm to market, without barriers." needs a Malayalam line **(new)** |
| Log in | Green band with logo and EN \| ML pill; Welcome back; phone; password; Forgot password?; Log in; "New to AgriChain? Create an account" | വീണ്ടും സ്വാഗതം · ഫോൺ നമ്പർ · പാസ്‌വേഡ് · ലോഗിൻ · AgriChain-ൽ പുതിയതാണോ? · അക്കൗണ്ട് തുടങ്ങുക (web) |
| Sign up | **No header or logo**, only a back arrow and "Create your account". Four role cards (2 by 2): Farmer "Sell your harvest", Buyer "Buy fresh produce", Warehouse owner "Rent out storage", Delivery partner "Deliver orders". Fields: name, phone, password, area (chips), village or town | നിങ്ങളുടെ അക്കൗണ്ട് തുടങ്ങുക · കർഷകൻ "വിളവ് വിൽക്കാം" · ബയർ "പുതിയ വിളകൾ വാങ്ങാം" · സംഭരണശാല ഉടമ "സംഭരണ സ്ഥലം വാടകയ്ക്ക് നൽകാം" · ഡെലിവറി പങ്കാളി "ഓർഡറുകൾ എത്തിക്കാം" (web) |
| Forgot password | Step 1 phone; step 2 six code boxes ("It works for 10 minutes."), new password twice, Change password, Send a new code, Back to log in | പാസ്‌വേഡ് മറന്നോ? · കോഡ് അയയ്ക്കുക · ഇത് 10 മിനിറ്റ് വരെ പ്രവർത്തിക്കും. · പുതിയ കോഡ് അയയ്ക്കുക · ലോഗിനിലേക്ക് മടങ്ങുക (web) |
| Session ended | "You were logged out because you were inactive" / "Your session expired" | കുറേ നേരം ഉപയോഗിക്കാത്തതിനാൽ ലോഗ് ഔട്ട് ആയി. വീണ്ടും ലോഗിൻ ചെയ്യൂ. · സെഷൻ കഴിഞ്ഞു. വീണ്ടും ലോഗിൻ ചെയ്യൂ. (web) |

## 6. Buyer
**Screens:** Home, Shop, Add-to-cart sheet, Farmer reviews sheet, Cart, Deliver-to sheet, Order placed, Orders, Order details, Rate sheet, Notifications, Account (with Edit profile and Change password).

| Screen | What it shows (English) | Malayalam |
|---|---|---|
| Home | Greeting; market price strip (moves; tap to stop, tap again to continue; thin dividers; no pause button); two farmer rows with rating and item count; tapping a farmer opens Shop filtered | അടുത്തുള്ള കർഷകർ (web) · "4.8 (12) · 4 ഇനങ്ങൾ" **(new)** |
| Shop | Search; filter chips; card = name, "farmer · kg", price top right, full-width **Add to cart** | ഓർഡർ ചെയ്യുക (web, now tab കട **(new)**) · {{qty}} കിലോ ലഭ്യം · കാർട്ടിൽ ചേർക്കുക (web) |
| Add-to-cart sheet | Item, market note ("₹2 above today's market price", below, same, or "Price set by the farmer"), kg stepper, availability, produce cost, "Delivery is added when you order.", Add to cart | ഓർഡർ ചെയ്യുമ്പോൾ ഡെലിവറി ചാർജ് ചേർക്കും. · കർഷകൻ നിശ്ചയിച്ച വില (web) |
| Cart | Item rows with steppers (no trash icon), one line per farmer "This order, with delivery", problems in red on the item, **Deliver to** + Change, Total, **Place order** | ഈ ഓർഡർ, ഡെലിവറി ഉൾപ്പെടെ · ആകെ, 2 ഓർഡറുകൾ **(new)** · നിങ്ങളുടെ കാർട്ട് (web) |
| Order placed | "N orders placed", farmer subtotals, **View my orders**, **Keep shopping** | {{count}} ഓർഡറുകൾ നൽകി. കർഷകർ ഉടൻ സ്ഥിരീകരിക്കും. (web) · button names **(new)** |
| Orders | Cards: items line, farmer line, status, total. Long status on its own line in Malayalam. Tap opens Order details | കർഷകന്റെ മറുപടിക്കായി കാത്തിരിക്കുന്നു · വഴിയിലാണ് · എത്തിച്ചു · റദ്ദാക്കി (web) |
| Order details | Progress line, call buttons for farmer and partner, produce, delivery, total, Cancel (while pending) | ഡെലിവറി പങ്കാളി · ഓർഡർ റദ്ദാക്കുക (web) |
| Rate sheet | One button **Rate this order**; stars for the farmer and for the delivery partner, optional comment, Send review | ഓർഡർ റേറ്റ് ചെയ്യുക **(new)** · റിവ്യൂ അയയ്ക്കുക (web) |
| Notifications | Full screen, back arrow, "Mark all read", unread dots, tap opens the right screen | അറിയിപ്പുകൾ · എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക (web) |
| Account | Profile card, Edit profile, Change password, Language (EN \| ML), Log out in red, note "Your phone number and area cannot be changed here." | എന്റെ അക്കൗണ്ട് · പാസ്‌വേഡ് മാറ്റുക (web) |

**Delivery address rule:** the Cart's "Deliver to" starts as the sign-up village or town. When the buyer types a proper address and orders, it is **remembered** for the next order (from the last order if the orders list returns it, else stored on the phone). The profile does not change.

## 7. Farmer
| Screen | What it shows (English) | Malayalam |
|---|---|---|
| Home | Greeting; "2 buyers are waiting."; **Sell produce** button; market price strip; "Needs your answer" card with Accept / Reject; 7-day earnings bars | നമസ്കാരം, {{name}}. · 2 ബയർമാർ കാത്തിരിക്കുന്നു. · വിള വിൽക്കുക · നിങ്ങളുടെ മറുപടി വേണം · കഴിഞ്ഞ 7 ദിവസത്തെ വരുമാനം (web) |
| My produce | "2 items on sale". Card: name, **Selling** pill, kg left, ₹/kg, market note ("₹2 above market" or "Price set by the farmer"), then three equal buttons **Change**, **Stop selling** (two lines, centred), **Delete**. Stopped section with **Sell again** and Delete | എന്റെ വിളകൾ · വിൽപനയിൽ · {{qty}} കിലോ ബാക്കി · വിപണിയേക്കാൾ ₹2 കൂടുതൽ · മാറ്റുക · വിൽപന നിർത്തുക · ഡിലീറ്റ് · നിർത്തിയവ · വീണ്ടും വിൽക്കുക (web) |
| Sell produce sheet | Choose produce; today's market price; price stepper with a ruler (fair range plus or minus 20%); kg stepper; total "50 kg × ₹48 = ₹2,400"; **Put for sale**. Add your own produce if not listed | വിള വിൽക്കുക · ഇന്നത്തെ വിപണി വില · വിൽപനയ്ക്ക് വയ്ക്കുക · നിങ്ങളുടെ വിള ചേർക്കുക (web) |
| Orders | Segments New / In progress / Done; cards with **Accept** and **Reject** | പുതിയത് · നടക്കുന്നവ · കഴിഞ്ഞവ · സ്വീകരിക്കുക · നിരസിക്കുക (web) |
| Storage | Segments Warehouses / My storage; warehouse cards with **View and book**; **Book space** sheet (produce, From, Until, kg, cost, Send request); My storage states: Overdue (Take out / Extend), In storage, Waiting for the owner (Cancel request) | സംഭരണം · അടുത്തുള്ള സംഭരണശാലകൾ · എന്റെ സംഭരണം · കണ്ട് ബുക്ക് ചെയ്യുക · അപേക്ഷ അയയ്ക്കുക · പുറത്തെടുക്കുക · നീട്ടുക (web) |
| Account | Profile, **My reviews** (rating), Edit profile, Change password, EN \| ML, Log out | എന്റെ അഭിപ്രായങ്ങൾ (web) |

## 8. Delivery partner
| Screen | What it shows (English) | Malayalam |
|---|---|---|
| Home | Greeting; card "One delivery is waiting near you." with the standard **See available deliveries** button; four stat cards (today, deliveries, this week, rating); Current delivery card with **Open delivery**; 7-day earnings bars | ഒരു ഡെലിവറി നിങ്ങളുടെ അടുത്ത് കാത്തിരിക്കുന്നു. · ലഭ്യമായ ഡെലിവറികൾ കാണുക · നിങ്ങളുടെ ഇപ്പോഴത്തെ ഡെലിവറി (web) |
| Available | Every card **identical**: item, kg and km on the left, "You earn ₹40" on the right, **Pickup** and **Drop** on a vertical line with two dots, full-width **Take this delivery** | ലഭ്യമായ ഡെലിവറികൾ · എടുക്കേണ്ട സ്ഥലം · എത്തിക്കേണ്ട സ്ഥലം · നിങ്ങൾക്ക് ലഭിക്കും · ഈ ഡെലിവറി എടുക്കുക (web) |
| Deliveries | Delay notice ("Running about 30 min late"), call buttons, **Mark delivered**, **Update delay**, **Give back**, history | വൈകുന്നു · താമസം മാറ്റുക · തിരികെ നൽകുക · എത്തിച്ചു (web) |
| Running late sheet | Reason chips (traffic, vehicle, weather, waiting at farm, other), minutes chips, **Tell the buyer and farmer** | ട്രാഫിക് · വാഹനത്തിന് തകരാർ · കാലാവസ്ഥ · ബയറെയും കർഷകനെയും അറിയിക്കുക (web) |
| Account | Same pattern as the farmer without My reviews (ratings card shows on Home) | എന്റെ അക്കൗണ്ട് (web) |

Partner pay rule (from the website): ₹20 per delivery plus ₹2 per kg.

## 9. Warehouse owner
| Screen | What it shows (English) | Malayalam |
|---|---|---|
| Home | Greeting; alert strips ("2 new booking requests need an answer", "A farmer asked to extend a booking", overdue); four stats (warehouses, space in use, active bookings, income); space bars per warehouse | 2 പുതിയ ബുക്കിംഗ് അപേക്ഷകൾക്ക് മറുപടി വേണം · ഒരു കർഷകൻ ബുക്കിംഗ് നീട്ടാൻ അപേക്ഷിച്ചു · ഉപയോഗത്തിലുള്ള സ്ഥലം · ബുക്കിംഗ് വരുമാനം (web) |
| My warehouses | Card: photo, cold or dry pill, rate, "about ₹ per quintal per month", space bar; **Change**, **Pause bookings**, **Remove**; greyed out with the explanation while bookings are open | എന്റെ സംഭരണശാലകൾ · ബുക്കിംഗ് നിർത്തുക · ഒഴിവാക്കുക · നിർത്താനോ ഒഴിവാക്കാനോ അതിലെ ബുക്കിംഗുകൾ തീർക്കുകയോ നിരസിക്കുകയോ ചെയ്യൂ. (web) |
| Add warehouse form | Name, place, cold or dry, total space, price per kg per day, photos (at least 1, up to 5; 2 of 5 shown) | സംഭരണശാല ചേർക്കുക · സംഭരണശാലയുടെ പേര് · ആകെ സ്ഥലം · ഫോട്ടോകൾ (web) |
| Bookings | Segments Requests / Current / Past; New request and Extension request cards with **Accept** and **Decline** | അപേക്ഷകൾ · നിലവിലുള്ളവ · കഴിഞ്ഞവ · പുതിയ അപേക്ഷ · സ്വീകരിക്കുക · നിരസിക്കുക (web) |
| Decline sheet | Reason (optional), **Yes, decline** | കാരണം (വേണമെങ്കിൽ) · അതെ, നിരസിക്കുക (web) |
| Account | Same pattern as the partner | എന്റെ അക്കൗണ്ട് (web) |

## 10. Checklist: please confirm or change
- [ ] Buyer first, then partner, farmer, owner (build order).
- [ ] Farmer's five tabs, with Reviews inside Account.
- [ ] Tab names in Malayalam for farmer, partner and owner.
- [ ] Sign-up with four role cards.
- [ ] "Sell again" on stopped produce (my addition, check against the website).
- [ ] Partner Home stats (today, deliveries, week, rating) are placeholders until the real fields are checked.
- [ ] The remember-last-address rule (needs the orders list to return the address; verify before Day 19).

## 11. Not drawn yet (same pattern, drawn when built)
Warehouse reviews sheet, Extend sheet, Cancel and Take out confirm dialogs, Edit profile, Change password, empty states for every list, Malayalam versions of the buyer's Login, Sign up, Notifications and Account, and of the farmer's Orders, Storage and Account, the partner's Deliveries and Running late sheet, and the owner's Warehouses, Add form and Decline sheet.

## 12. Lessons that shape the design
Numbers in one style; tint the background only; keep words on key buttons; equal-width 44 px buttons with centred text; cards of the same kind use the same layout in every language; look at the user's screenshot before redrawing (Mobile.md MD1 to MD4).

## 13. After this review
1. User confirms or changes the checklist in section 10.
2. Day 0: check Node 22, install Expo Go on both phones, create `mobileft\agrichain-mobile`.
3. Each build day is planned with the user first (see [Mobile.md section 5](Mobile.md#5-the-day-by-day-build-plan)).
