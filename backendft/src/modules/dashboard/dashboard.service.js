import pool from "../../db/pool.js";
import { BOOKING_STATUS, ORDER_STATUS, ROLES } from "../../utils/constants.js";
import { HOLD_END, SPACE_HOLDING } from "../warehouses/capacity.js";

/** { PENDING: 0, CONFIRMED: 2, ... } with every status present */
function countByStatus(rows) {
  const counts = Object.fromEntries(Object.values(ORDER_STATUS).map((status) => [status, 0]));
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

async function farmerDashboard(user) {
  const farmerOrders = "FROM orders o WHERE o.farmer_id = $1";

  const [earnings, statuses, listings, topProduce, rating, last7Days] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(o.total_price) FILTER (WHERE o.status = 'DELIVERED'), 0) AS total_earned,
         COALESCE(SUM(o.total_price) FILTER (WHERE o.status IN ('CONFIRMED', 'OUT_FOR_DELIVERY')), 0)
           AS pending_earnings
       ${farmerOrders}`,
      [user.id],
    ),
    pool.query(`SELECT o.status, COUNT(*) AS count ${farmerOrders} GROUP BY o.status`, [user.id]),
    pool.query(
      "SELECT COUNT(*) FILTER (WHERE is_active) AS active, COUNT(*) AS total FROM listings WHERE farmer_id = $1 AND deleted_at IS NULL",
      [user.id],
    ),
    pool.query(
      `SELECT p.name AS produce_name, SUM(oi.quantity) AS quantity_sold, SUM(oi.line_total) AS revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN listings l ON l.id = oi.listing_id
       JOIN produce p ON p.id = l.produce_id
       WHERE o.farmer_id = $1 AND o.status = 'DELIVERED'
       GROUP BY p.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [user.id],
    ),
    pool.query(
      `SELECT ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*) AS review_count
       FROM reviews WHERE farmer_id = $1`,
      [user.id],
    ),
    pool.query(
      `SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, COALESCE(SUM(o.total_price), 0) AS revenue
       FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') AS day
       LEFT JOIN orders o
         ON o.status = 'DELIVERED'
        AND o.delivered_at::date = day::date
        AND o.farmer_id = $1
       GROUP BY day
       ORDER BY day`,
      [user.id],
    ),
  ]);

  return {
    role: ROLES.FARMER,
    ...earnings.rows[0],
    orders_by_status: countByStatus(statuses.rows),
    active_listings: listings.rows[0].active,
    total_listings: listings.rows[0].total,
    top_produce: topProduce.rows,
    rating: rating.rows[0].rating,
    review_count: rating.rows[0].review_count,
    revenue_last_7_days: last7Days.rows,
  };
}

async function buyerDashboard(user) {
  const [spend, statuses, favourites] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(total_price + delivery_fee) FILTER (WHERE status = 'DELIVERED'), 0) AS total_spent,
         COALESCE(SUM(total_price + delivery_fee)
                  FILTER (WHERE status IN ('PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY')), 0) AS upcoming_spend
       FROM orders WHERE buyer_id = $1`,
      [user.id],
    ),
    pool.query("SELECT status, COUNT(*) AS count FROM orders WHERE buyer_id = $1 GROUP BY status", [user.id]),
    pool.query(
      `SELECT f.id AS farmer_id, f.name AS farmer_name, COUNT(*) AS orders
       FROM orders o
       JOIN users f ON f.id = o.farmer_id
       WHERE o.buyer_id = $1 AND o.status <> 'CANCELLED'
       GROUP BY f.id, f.name
       ORDER BY orders DESC, f.name
       LIMIT 3`,
      [user.id],
    ),
  ]);

  return {
    role: ROLES.BUYER,
    ...spend.rows[0],
    orders_by_status: countByStatus(statuses.rows),
    favourite_farmers: favourites.rows,
  };
}

async function ownerDashboard(user) {
  const [capacity, bookings, extensions, rating, recentReviews] = await Promise.all([
    // "In use" is what bookings hold today (waiting requests hold space too)
    pool.query(
      `SELECT
         COUNT(*) AS warehouses,
         COALESCE(SUM(w.total_capacity_kg), 0) AS total_capacity_kg,
         COALESCE(SUM((
           SELECT COALESCE(SUM(b.quantity_kg), 0) FROM warehouse_bookings b
           WHERE b.warehouse_id = w.id AND b.status IN ${SPACE_HOLDING}
             AND b.start_date <= CURRENT_DATE AND CURRENT_DATE <= ${HOLD_END}
         )), 0) AS used_capacity_kg
       FROM warehouses w WHERE w.owner_id = $1 AND w.deleted_at IS NULL`,
      [user.id],
    ),
    // Income counts approved and finished bookings; an overdue booking keeps adding a day's charge
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE b.status = $2) AS active_bookings,
         COUNT(*) FILTER (WHERE b.status = $3) AS pending_requests,
         COUNT(*) FILTER (WHERE b.status = $2 AND b.end_date < CURRENT_DATE) AS overdue_bookings,
         COALESCE(SUM(
           CASE WHEN b.status = $2 AND b.end_date < CURRENT_DATE
                THEN b.rate_per_kg_per_day * b.quantity_kg * ((CURRENT_DATE - b.start_date) + 1)
                ELSE b.amount_to_pay END
         ) FILTER (WHERE b.status IN ($2, $4)), 0) AS booking_revenue
       FROM warehouse_bookings b
       JOIN warehouses w ON w.id = b.warehouse_id
       WHERE w.owner_id = $1`,
      [user.id, BOOKING_STATUS.ACTIVE, BOOKING_STATUS.REQUESTED, BOOKING_STATUS.RELEASED],
    ),
    pool.query(
      `SELECT COUNT(*) AS pending_extensions
       FROM booking_extensions e
       JOIN warehouse_bookings b ON b.id = e.booking_id
       JOIN warehouses w ON w.id = b.warehouse_id
       WHERE w.owner_id = $1 AND e.status = 'PENDING'`,
      [user.id],
    ),
    pool.query(
      `SELECT ROUND(AVG(wr.rating)::numeric, 1) AS rating, COUNT(*) AS review_count
       FROM warehouse_reviews wr JOIN warehouses w ON w.id = wr.warehouse_id
       WHERE w.owner_id = $1`,
      [user.id],
    ),
    pool.query(
      `SELECT wr.id, wr.rating, wr.comment, wr.created_at, w.id AS warehouse_id, w.name AS warehouse_name,
              SPLIT_PART(f.name, ' ', 1) AS farmer_name
       FROM warehouse_reviews wr
       JOIN warehouses w ON w.id = wr.warehouse_id
       JOIN users f ON f.id = wr.farmer_id
       WHERE w.owner_id = $1
       ORDER BY wr.created_at DESC
       LIMIT 5`,
      [user.id],
    ),
  ]);

  const { warehouses, total_capacity_kg, used_capacity_kg } = capacity.rows[0];
  return {
    role: ROLES.WAREHOUSE_OWNER,
    warehouses,
    total_capacity_kg,
    used_capacity_kg,
    occupancy_pct: total_capacity_kg ? Math.round((used_capacity_kg / total_capacity_kg) * 1000) / 10 : 0,
    ...bookings.rows[0],
    ...extensions.rows[0],
    ...rating.rows[0],
    recent_reviews: recentReviews.rows,
  };
}

async function partnerDashboard(user) {
  const [mine, available, week, rating] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'DELIVERED') AS completed_deliveries,
         COUNT(*) FILTER (WHERE status = 'OUT_FOR_DELIVERY') AS active_deliveries,
         COALESCE(SUM(delivery_fee) FILTER (WHERE status = 'DELIVERED'), 0) AS total_earned,
         COALESCE(SUM(delivery_fee) FILTER (WHERE status = 'DELIVERED' AND delivered_at::date = CURRENT_DATE), 0) AS earned_today
       FROM orders WHERE delivery_partner_id = $1`,
      [user.id],
    ),
    pool.query(
      `SELECT COUNT(*) AS available_now
       FROM orders o
       JOIN users f ON f.id = o.farmer_id
       WHERE o.status = 'CONFIRMED' AND o.delivery_partner_id IS NULL AND f.region_id = $1`,
      [user.regionId],
    ),
    pool.query(
      `SELECT TO_CHAR(day, 'YYYY-MM-DD') AS date, COALESCE(SUM(o.delivery_fee), 0) AS earned
       FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') AS day
       LEFT JOIN orders o
         ON o.status = 'DELIVERED'
        AND o.delivered_at::date = day::date
        AND o.delivery_partner_id = $1
       GROUP BY day
       ORDER BY day`,
      [user.id],
    ),
    pool.query(
      "SELECT ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*) AS review_count FROM partner_reviews WHERE partner_id = $1",
      [user.id],
    ),
  ]);

  return {
    role: ROLES.DELIVERY_PARTNER,
    ...mine.rows[0],
    ...available.rows[0],
    ...rating.rows[0],
    earnings_last_7_days: week.rows,
  };
}

const DASHBOARDS = {
  [ROLES.FARMER]: farmerDashboard,
  [ROLES.BUYER]: buyerDashboard,
  [ROLES.WAREHOUSE_OWNER]: ownerDashboard,
  [ROLES.DELIVERY_PARTNER]: partnerDashboard,
};

export function getDashboard(user) {
  return DASHBOARDS[user.role](user);
}
