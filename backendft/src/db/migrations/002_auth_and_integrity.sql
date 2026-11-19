-- 002: Password auth + tighter data integrity.

-- users: login is phone + password, every user belongs to a region
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
ALTER TABLE users ALTER COLUMN region_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

-- produce
ALTER TABLE produce ALTER COLUMN category SET NOT NULL;
ALTER TABLE produce ALTER COLUMN unit SET NOT NULL;

-- price_history: (produce_id, date) was constrained twice
ALTER TABLE price_history DROP CONSTRAINT IF EXISTS unique_price_per_day;
ALTER TABLE price_history ALTER COLUMN produce_id SET NOT NULL;
ALTER TABLE price_history ALTER COLUMN date SET NOT NULL;
ALTER TABLE price_history ALTER COLUMN market_price TYPE NUMERIC(10, 2);

-- listings: market prices can have decimals; remember the market price at listing time
ALTER TABLE listings ALTER COLUMN listing_price TYPE NUMERIC(10, 2);
ALTER TABLE listings ADD COLUMN market_price NUMERIC(10, 2);
UPDATE listings SET market_price = listing_price WHERE market_price IS NULL;
ALTER TABLE listings ALTER COLUMN farmer_id SET NOT NULL;
ALTER TABLE listings ALTER COLUMN produce_id SET NOT NULL;
ALTER TABLE listings ALTER COLUMN price_source SET NOT NULL;
ALTER TABLE listings ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE listings ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE listings ADD CONSTRAINT listings_price_source_check CHECK (price_source IN ('SCRAPED', 'FARMER'));
ALTER TABLE listings ADD CONSTRAINT listings_available_qty_check CHECK (available_qty >= 0);
ALTER TABLE listings ADD CONSTRAINT listings_listing_price_check CHECK (listing_price > 0);

-- orders: only known statuses, track the last status change
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'));
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE orders ALTER COLUMN created_at SET NOT NULL;

-- warehouses
ALTER TABLE warehouses ALTER COLUMN is_cold_storage SET NOT NULL;
ALTER TABLE warehouses ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE warehouses ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE warehouses ADD CONSTRAINT warehouses_capacity_within_total_check
  CHECK (available_capacity_kg <= total_capacity_kg);

-- warehouse_bookings: a booking always has a date range
UPDATE warehouse_bookings SET end_date = start_date WHERE end_date IS NULL;
ALTER TABLE warehouse_bookings ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE warehouse_bookings ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE warehouse_bookings ALTER COLUMN status SET NOT NULL;
ALTER TABLE warehouse_bookings ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE warehouse_bookings ADD CONSTRAINT warehouse_bookings_status_check
  CHECK (status IN ('ACTIVE', 'RELEASED'));
ALTER TABLE warehouse_bookings ADD CONSTRAINT warehouse_bookings_dates_check
  CHECK (end_date >= start_date);

-- indexes for the common lookups
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_region ON warehouses(region_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_owner ON warehouses(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer ON warehouse_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_warehouse ON warehouse_bookings(warehouse_id);
