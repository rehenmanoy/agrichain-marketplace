# AgriChain: Business Plan and Decisions

How AgriChain works as a real product: who pays, how farmers without smartphones take part, how farmers are verified, how delivery and payments work. Decided with the user part by part, starting 2026-11-03.

> **Rule for this file:** every business decision goes here the day it is made. Open questions stay in section 1 at the top until they are answered, then move into their part below. Nothing decided in chat is left only in chat.

---

## 1. Open questions (decide next)

Look here first. Answer these one at a time, then move each answer into its part.

**Pitch preparation:** the hard questions a board could ask are in [Board-Questions.md](Board-Questions.md). We are answering those next. Q1 and Q2 below are on hold until later (user decision 2026-11-05).

| # | Question | Part | Notes |
|---|---|---|---|
| Q1 | **Which area for the pilot?** Erumely (where the demo data is) or another place we know well? | 6 | Discussion paused here 2026-11-03 |
| Q2 | **New order:** finish the plan, pitch, then the pilot (paid by the investment), then hotels? | 6 | Corrected 2026-11-04: the pilot starts after the pitch. Not yet confirmed |
| Q3 | **Exact fees:** buyer 3%, warehouse 5%, AgriChain's share of the delivery fee ₹5. Confirm or change. | 2 | The mix is agreed; the numbers are proposals |
| Q4 | **Exact delivery time slots** (for example 7 to 10 am) | 5 | To be set when the pilot is planned |
| Q5 | **Coordinator pay per visit:** how much? | 3 | Pay per visit is agreed; the amount is not |
| Q6 | **Founders' agreement:** who owns what % of AgriChain, in writing, before pitching | 2 | Suggested, not yet discussed |
| Q7 | **Bad produce at pickup:** the partner refuses it. Does the partner get anything for the wasted trip, and who pays it? | 7 | Not discussed |
| Q8 | **Cash on delivery:** allowed, or online payment only? | 7 | Not discussed. The payment plan below assumes online payment |
| Q9 | **Business buyer monthly fee:** how much? | 2 | **Monthly fee decided 2026-11-16**; the amount is open (₹500 used as an example) |
| Q10 | **Legal checks:** e-commerce consumer rules, food safety (FSSAI) registration, data protection (DPDP Act) | Gap 3 | Not started. Needs someone who knows the rules |
| Q11 | **Produce grades:** Grade A / Grade B at different prices? | Gap 4 | Not started |
| Q12 | **Payment company:** which one (for example Razorpay, which can hold and split money) | 7 | To be picked when payments are built |

---

## 2. The product owner's role and income (decided 2026-11-03)

- **AgriChain is the user's own product.** The user and their team run it. It will **not be sold**. Investors (for example bigger startups) can put money in for a share of the company.
- **AgriChain is not a middleman.** A middleman takes money from the farmer in secret by paying less than the real price. AgriChain earns openly from other people, never from the farmer.
- **The rule:** the farmer pays **₹0** and earns more on AgriChain than at the local market.
- **Monthly fee for business buyers (decided 2026-11-16):** eateries, hotels and restaurants pay a monthly fee, and **home prices stay the same**. Reason: bigger orders barely raise AgriChain's share (1 kg keeps about ₹3.70, 20 kg about ₹7), because the payment charge is taken on the whole bill.
- **Pilot money (decided 2026-11-07):** about ₹6 per order is accepted during the pilot, and the pilot isn't expected to pay for itself. **Fees won't be raised** to fix this, because farm-fresh food must stay affordable. Income grows through more orders and more business buyers.
- **Coordinator work (decided 2026-11-07):** after the first visit, farmers phone the coordinator with updates, so visits aren't daily.
- **First customers (decided 2026-11-07):** homes and small eateries, tea shops and canteens, while marketing to hotels. Homes build ratings and delivery history rather than profit. Big hotels follow once trust and steady supply exist.
- **An extra channel, not a replacement (decided 2026-11-06).** Farmers aren't asked to leave their trader on day one. They sell what they can on AgriChain and the rest as usual. As buyers and hotels join, more of the harvest moves over and they depend less on the trader. The promise is to reduce dependence on the middleman step by step, not to remove him at once.

Who pays, and when:

| When | Who pays | Proposed amount (see Q3) |
|---|---|---|
| From the start | **Buyers:** a small % of every order | 3% (₹15 on a ₹500 order) |
| From the start | **Warehouse owners:** commission per booking | 5% (₹75 on a ₹1,500 booking) |
| From the start | **Delivery:** AgriChain keeps a small share of each delivery fee | ₹5 per order, the rest to the partner |
| Once trust is built | **Eateries, hotels and restaurants:** a **monthly fee** (decided 2026-11-16) | Amount open (Q9). Example: 20 eateries × ₹500 = ₹10,000 a month, which would take about 1,667 home orders |
| Last | **Government** grants or support | Decide later |
| Never | **Farmers** | ₹0 |

Notes:
- Hotels will not trust a new app at first. Build trust with home buyers' ratings and delivery history, a free trial week, and free replacement of bad produce.
- The buyer's total (farmer's price + AgriChain's % + delivery) must stay cheaper or fresher than the local shop, so the % stays small.
- Before pitching: put ownership in writing (Q6), and have real pilot numbers, since investors ask "how many people use it?" first.

## 3. Farmers without smartphones (decided 2026-11-03)

- **Register once at Akshaya.** AgriChain pays the Akshaya fee, not the farmer. No daily visits.
- **Standing listings.** The farmer says once, for example "about 20 kg tomato every Monday and Thursday", and it repeats on its own until something changes.
- **A family helper.** A son, daughter or anyone can help, but money always goes to the **farmer's own bank account**.
- **No drop-off point.** Carrying produce to a collection point costs the farmer money, so the **delivery partner picks up from the farm**.
- **Coordinator.** A trusted local person who **visits the farmer**. In Kerala that's about **4 or 5 farmers** per coordinator. Paid by AgriChain **per visit** (amount: Q5). The coordinator registers farmers, updates listings for them, checks quality and answers questions in Malayalam. The coordinator **never sets the price and never touches the farmer's money**.
- **Helper option in the app.** A helper or coordinator has their **own login** with limited rights, never the farmer's password. **Every change made by a helper needs the farmer's OTP.**
- **SMS and calls** (confirm, change quantity, pause) are pitched as a later feature because an SMS service costs money. A message from the farmer's own registered number already proves it's them, so it needs no extra OTP.

## 4. Verifying farmers (decided 2026-11-03)

Goal: only real farmers sell. Stop fakes and stop traders posing as farmers (that would bring the middleman back).

1. **At Akshaya registration:** identity check (Aadhaar-based eKYC through an approved service) plus **one proof of farming**: a Krishi Bhavan certificate, a land tax receipt, a Kisan Credit Card or PM-KISAN registration, or membership of a farmers' group or cooperative. Farmers on **leased land** have no land papers, so a Krishi Bhavan letter or a farmers' group vouching for them also counts.
2. **The coordinator visits** the farm and confirms it.
3. **Admin approval.** Only after the coordinator's report and the admin's check of the documents does the farmer get the **Verified farmer** badge and can sell. **Two people must agree**, so no one person can approve a fake farmer. The app keeps a record of who approved whom.
4. **Keep checking:**
   - At sign-up the farmer records crops and roughly how much land. Listings far beyond what that land can grow are flagged (this catches traders).
   - New farmers start with small limits (kg per order) that grow with good deliveries and ratings.
   - Photos at pickup and delivery, plus buyer complaints. Repeated bad produce means suspension.

**Who is the admin:**

| Role | Who | What they can do |
|---|---|---|
| Main admin | The user and 1 or 2 trusted teammates (for now) | Approve or reject farmers, suspend accounts, handle complaints, add coordinators and admins |
| Area admin | A team member per district (**later**, when AgriChain grows) | The same, for their area only |
| Coordinator | Local person | Visits and reports. Cannot approve alone |
| Krishi Bhavan officer | Government | Only gives the proof-of-farming letter. No access to the app |

Government officials give **documents**; AgriChain's team makes the **decisions**, so the product doesn't depend on an outside office.

## 5. Delivery (decided 2026-11-03)

- **No vehicles of our own.** Too expensive for a new startup.
- **Local delivery partners** (auto, pickup and bike owners) register in the app and earn the delivery fee. The app already works this way.
- **Fixed delivery times**, so one partner picks up from several farms on one route. This matters for money: a single 2 kg order pays only ₹24 (₹20 + ₹2 × 2), not worth a trip alone. Exact slots: Q4.
- **Bigger orders later:** mini-trucks through a company like Porter for hotel-size orders. First check who works around Erumely and Kanjirapally.
- **Self pickup:** a buyer living nearby collects from the farm and pays no delivery fee.
- **Fault by photo:** the partner takes a photo at pickup, the buyer at delivery. Fine at pickup but damaged at delivery means the partner's fault. Bad at pickup means the farmer's fault. Damage handling is in section 7.

## 6. Getting the first users: the pilot (open)

Proposed, **not yet agreed** (Q1, Q2). All of this is planning for now: the pitch names the pilot, and the pilot starts only after the business owner agrees.

1. Finish the plan, then pitch the working app and this plan.
2. If they agree, their investment pays for the pilot, in one area only (for example Erumely).
3. Farmers first: 10 to 20, brought in by the coordinators, growing common vegetables (tomato, beans, banana, tapioca).
4. Then 50 to 100 home buyers, through residents' associations, church and temple groups and local WhatsApp groups, plus small eateries, tea shops and canteens. Free delivery on the first order.
5. Run for 1 to 2 months and record orders, repeat buyers, and how much more farmers earned than at the market.
6. Then hotels and restaurants, with those numbers and ratings, and then more areas.

Before the pitch, at no cost: talk to 5 to 10 farmers and a few shop or hotel owners and note what they say (suggested, not yet agreed).

## 7. Payments (decided 2026-11-03)

**When payments are built in the app, they follow this section exactly.**

### The money flow

1. The buyer pays online (UPI or card) at checkout (cash on delivery: Q8).
2. The money is **held** by the payment company (Q12), not paid to anyone yet.
3. **Only after the order is marked Delivered** is it split three ways: the **farmer's own bank account**, the **delivery partner**, and **AgriChain**.
4. If the order fails, the buyer is refunded from the held money before anyone is paid.

Example: 10 kg of produce for ₹500, with the proposed fees.

| Buyer pays | Amount |
|---|---|
| Produce | ₹500 |
| AgriChain 3% | ₹15 |
| Delivery fee (₹20 + ₹2 × 10 kg) | ₹40 |
| **Total** | **₹555** |

| After delivery, goes to | Amount |
|---|---|
| Farmer | ₹500 |
| Delivery partner (₹40 minus AgriChain's ₹5) | ₹35 |
| AgriChain (₹15 + ₹5) | ₹20 |
| **Total** | **₹555** |

**Not yet counted in this example:** the payment company's charge. At about 2.36% (2% + GST) that's ₹13.10 on ₹555, so AgriChain keeps about ₹5.90 after the ₹1 damage fund, before any split fee, SMS or staff costs. See [Board-Questions.md](Board-Questions.md) B1.

### When things go wrong

| Case | What happens |
|---|---|
| **Not delivered at all** | Full refund to the buyer. Nobody is paid. |
| **Bad produce at pickup** (farmer's fault) | The partner refuses it with a photo. The buyer is refunded; the farmer isn't paid. (Partner's wasted trip: Q7) |
| **Damaged on the way** (partner's fault) | See below |

**Damage by the partner:**

1. The partner reports it in the app with a **photo and a remark** (for example "box fell, 2 kg tomato crushed").
2. **The buyer chooses:** wait for a replacement (a little late), or a refund for the damaged part.
3. **Replacement:** the partner goes back to the farmer for the damaged quantity only and pays for the extra trip. The partner still gets **only the original agreed fee**.
4. **The farmer is paid for everything they gave**, the damaged batch included. The partner pays the farmer for the damaged part (for example 2 kg × ₹50 = ₹100), cut from their earnings, **up to ₹150**. Anything above ₹150 comes from the **damage fund**.
5. **The farmer has no more stock:** the buyer is refunded for that part; the farmer is still paid as in step 4.
6. **3 damage reports in a month means suspension.**

### The damage fund

- A small pot kept for accidents. **₹1 from every order** goes in, taken **from AgriChain's own share**, so the buyer pays nothing extra and buyers can be told their order is protected.
- It pays the part of a damage above ₹150. Unused money stays in the pot.
- Example: 1,000 orders a month adds ₹1,000. A ₹400 damage: the partner pays ₹150, the pot pays ₹250.
- Later, when AgriChain is bigger, it can be replaced by real insurance.

---

## 8. What the app needs because of these decisions

None of this is built yet. Each item needs its own plan before code (working agreement 2).

| Feature | From part | Status |
|---|---|---|
| **Admin role** (approve farmers, suspend, complaints, record of approvals) | 4 | Not started |
| Farmer verification: status (pending, verified, rejected), document upload, coordinator visit report, Verified badge | 4 | Not started |
| Crops and land area at sign-up, flag listings beyond what the land can grow, starting limits for new farmers | 4 | Not started |
| **Helper / coordinator role** with its own login; every change needs the farmer's OTP | 3 | Not started |
| Standing (repeating) listings | 3 | Not started |
| Farmer's bank account details (changes need OTP) | 3, 7 | Not started |
| **Online payment** with money held until delivery and a three-way split | 7 | Not started (the app has no payment system today) |
| Refunds; damage report with photo and remark; buyer's choice of replacement or refund | 7 | Not started |
| Partner pays up to ₹150 from earnings; damage fund (₹1 per order from AgriChain's share) | 7 | Not started |
| Suspension after 3 damage reports in a month | 7 | Not started |
| Photos at pickup and delivery | 5, 7 | Not started |
| Fixed delivery time slots | 5 | Not started |
| Self pickup (no delivery fee) | 5 | Not started |
| AgriChain fees (buyer %, warehouse commission, delivery share) | 2 | Not started |
| SMS / missed call for farmers | 3 | Later |

## 9. Decision log

Newest first. One line per discussion.

- **2026-11-16:** Eateries, hotels and restaurants pay a monthly fee; home prices unchanged (Board Questions B1).
- **2026-11-07:** First customers are homes and small eateries (Board Questions A7). About ₹6 per order accepted for the pilot, no fee increases, and coordinator updates by phone after the first visit (B1, B2, B4).
- **2026-11-06:** AgriChain is an extra channel for farmers, not a replacement for the trader (Board Questions A1, A4).
- **2026-11-05:** Pilot questions put on hold. Went through the whole project as a critical board member and listed the hard questions in [Board-Questions.md](Board-Questions.md).
- **2026-11-04:** Order corrected by the user: this is planning, and the pilot starts after the pitch.

- **2026-11-03:** Parts 2 to 5 and 7 decided (role and income, farmers without smartphones, verification and admin, delivery, payments with damage handling and the damage fund). Part 6 (pilot) proposed; paused at Q1 and Q2, to continue next session.
