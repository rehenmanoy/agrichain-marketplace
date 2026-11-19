-- 008: Warehouse bookings become requests the owner approves, with extensions, and warehouses get
-- photos and can be removed. Capacity is now worked out per date range from the bookings, so the
-- running counter column is dropped.

-- Warehouses: soft delete (history stays), no stored free-space counter
ALTER TABLE warehouses ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE warehouses DROP COLUMN available_capacity_kg;

-- Photos (the files live on disk; 2 to 5 are required when a warehouse is created)
CREATE TABLE warehouse_photos (
  id           SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL UNIQUE,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warehouse_photos_warehouse ON warehouse_photos(warehouse_id);

-- Bookings: request, then approved or declined; the price per kg per day is remembered
ALTER TABLE warehouse_bookings DROP CONSTRAINT warehouse_bookings_status_check;
ALTER TABLE warehouse_bookings ADD CONSTRAINT warehouse_bookings_status_check
  CHECK (status IN ('REQUESTED', 'ACTIVE', 'REJECTED', 'CANCELLED', 'RELEASED'));

ALTER TABLE warehouse_bookings ADD COLUMN rate_per_kg_per_day NUMERIC(10, 4);
UPDATE warehouse_bookings b
SET rate_per_kg_per_day = w.price_per_kg_per_day
FROM warehouses w
WHERE w.id = b.warehouse_id;
ALTER TABLE warehouse_bookings ALTER COLUMN rate_per_kg_per_day SET NOT NULL;
ALTER TABLE warehouse_bookings ADD CONSTRAINT warehouse_bookings_rate_check CHECK (rate_per_kg_per_day >= 0);

ALTER TABLE warehouse_bookings ADD COLUMN decided_at TIMESTAMP;
ALTER TABLE warehouse_bookings ADD COLUMN decision_note TEXT;

CREATE INDEX idx_bookings_warehouse_status ON warehouse_bookings(warehouse_id, status);

-- Extension requests: the farmer asks for a later end date, the owner answers
CREATE TABLE booking_extensions (
  id           SERIAL PRIMARY KEY,
  booking_id   INTEGER NOT NULL REFERENCES warehouse_bookings(id) ON DELETE CASCADE,
  new_end_date DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  decided_at   TIMESTAMP
);

-- A booking has at most one extension waiting for an answer
CREATE UNIQUE INDEX idx_one_pending_extension ON booking_extensions(booking_id) WHERE status = 'PENDING';
CREATE INDEX idx_extensions_booking ON booking_extensions(booking_id);
